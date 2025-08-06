export interface TErrorSources {
  path: string;
  message: string;
}

export interface TMongooseErrorSource {
  field: string,
  value:string;
  message:string;
}

export interface TGenericErrorResponse {
  statusCode: number;
  message: string;
  errorSources?: TErrorSources[] |
  TMongooseErrorSource[];
}
