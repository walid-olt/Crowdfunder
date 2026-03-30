import { Handler, Response } from 'express';

export interface ApiResponse<T> {
  status: "success" ;
  results?: number;
  data?: T;
  message?: string;
}

export const sendResponse = <T>(
  res: Response, 
  statusCode: number, 
  data: T, 
  message?: string
): Response => {
  const responseBody: ApiResponse<T> = {
    status: 'success',
    message,
    // If data is an array, automatically include a 'results' count
    ...(Array.isArray(data) && { results: data.length }),
    data,
  };

  return res.status(statusCode).json(responseBody);
};

export const placeholder : Handler = (req,res)=>{
  const {user , params , body} = req 
  return sendResponse(res , 200 , {user , params , body })
} 