import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabaseConfig } from '../config/env.config';

dotenv.config();

const supabaseUrl = supabaseConfig.supabaseUrl;
const supabaseKey = supabaseConfig.supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL and Key must be defined in your .env file');
    throw new Error('Supabase URL and Key must be defined in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

