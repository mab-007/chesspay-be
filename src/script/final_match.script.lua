-- KEYS[1]: The key for the global matchmaking sorted set (e.g., 'global_matchmaking_queue')
-- ARGV[1]: The current player's rating (e.g., 1500)
-- ARGV[2]: The current player's details as a JSON string (your "schema structure")
-- ARGV[3]: The ideal rating tolerance (e.g., 50)
-- ARGV[4]: The user's consent for an extended search ('true' or 'false')

local queue_key = KEYS[1]
local rating = tonumber(ARGV[1])
local player_details_json = ARGV[2] -- This JSON string is your schema
local tolerance = tonumber(ARGV[3])
local extended_search_consent = ARGV[4] == 'true'

-- To prevent matching with oneself, first remove the current player.
-- This has no effect if the player isn't already in the queue.
redis.call('ZREM', queue_key, player_details_json)

-- STEP 1: Perform the initial, strict search within the ideal tolerance.
local ideal_min_rating = rating - tolerance
local ideal_max_rating = rating + tolerance
local ideal_opponents = redis.call('ZRANGEBYSCORE', queue_key, ideal_min_rating, ideal_max_rating, 'LIMIT', 0, 1)

if #ideal_opponents > 0 then
    -- Success! Found a perfect match.
    local opponent_details = ideal_opponents[1]
    redis.call('ZREM', queue_key, opponent_details)
    return {player_details_json, opponent_details}
end

-- STEP 2: If no ideal match, perform extended search if the user consented.
if extended_search_consent then
    -- Find the closest opponent with a HIGHER rating.
    local higher_opp_array = redis.call('ZRANGEBYSCORE', queue_key, '(' .. rating, '+inf', 'LIMIT', 0, 1)

    -- Find the closest opponent with a LOWER rating.
    local lower_opp_array = redis.call('ZREVRANGEBYSCORE', queue_key, '(' .. rating, '-inf', 'LIMIT', 0, 1)

    local final_opponent_details = nil

    if #higher_opp_array > 0 and #lower_opp_array > 0 then
        -- Both a higher and lower opponent exist. Find which one is closer.
        local higher_opp_details = higher_opp_array[1]
        local lower_opp_details = lower_opp_array[1]

        local higher_opp_rating = tonumber(redis.call('ZSCORE', queue_key, higher_opp_details))
        local lower_opp_rating = tonumber(redis.call('ZSCORE', queue_key, lower_opp_details))

        if (higher_opp_rating - rating) < (rating - lower_opp_rating) then
            final_opponent_details = higher_opp_details
        else
            final_opponent_details = lower_opp_details
        end
    elseif #higher_opp_array > 0 then
        final_opponent_details = higher_opp_array[1]
    elseif #lower_opp_array > 0 then
        final_opponent_details = lower_opp_array[1]
    end

    if final_opponent_details then
        -- Success! Found the next best match.
        redis.call('ZREM', queue_key, final_opponent_details)
        return {player_details_json, final_opponent_details}
    end
end

-- FINAL STEP: If all match attempts are exhausted, add the player to the queue.
-- This block is reached if:
-- 1. No ideal match was found AND extended search was not allowed.
-- 2. No ideal match was found AND the extended search also found no one.
redis.call('ZADD', queue_key, rating, player_details_json)
return nil