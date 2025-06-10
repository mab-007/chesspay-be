//create a file to use for REST API utilities
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

// Function to make a GET request
export async function getRequest<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
        const response = await axios.get<T>(url, config);
        return response.data;
    } catch (error) {
        console.error('Error making GET request:', error);
        throw error;
    }
}

// Function to make a POST request
export async function postRequest<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R> {
    try {
        const response = await axios.post<R>(url, data, config);
        return response.data;
    } catch (error) {
        console.error('Error making POST request:', error);
        throw error;
    }
}

// Function to make a PUT request
export async function putRequest<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R> {
    try {
        const response = await axios.put<R>(url, data, config);
        return response.data;
    } catch (error) {
        console.error('Error making PUT request:', error);
        throw error;
    }
}

// Function to make a DELETE request
export async function deleteRequest<R>(url: string, config?: AxiosRequestConfig): Promise<R> {
    try {
        const response = await axios.delete<R>(url, config);
        return response.data;
    } catch (error) {
        console.error('Error making DELETE request:', error);
        throw error;
    }
}

// Function to make a PATCH request
export async function patchRequest<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R> {
    try {
        const response = await axios.patch<R>(url, data, config);
        return response.data;
    } catch (error) {
        console.error('Error making PATCH request:', error);
        throw error;
    }
}