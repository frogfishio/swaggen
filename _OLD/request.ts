export class Request {
  // You can add properties that are commonly used in requests, such as:
  method: string;
  headers: Record<string, string>;
  body: any;
  url: string;

  constructor(
    method: string,
    headers: Record<string, string> = {},
    body: any = null,
    url: string = ""
  ) {
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.url = url;
  }
}

export class Response {
  // You can add properties that are commonly used in responses, such as:
  statusCode: number;
  headers: Record<string, string>;
  body: any;

  constructor(
    statusCode: number = 200,
    headers: Record<string, string> = {},
    body: any = null
  ) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.body = body;
  }
}

interface Handler {
  get?(req: Request): Promise<Response>;
  post?(req: Request): Promise<Response>;
  put?(req: Request): Promise<Response>;
  delete?(req: Request): Promise<Response>;
}

export class BaseHandler implements Handler {
  // Handle GET request
  public async get(req: Request): Promise<Response> {
    throw new Error("GET method not implemented");
  }

  // Handle POST request
  public async post(req: Request): Promise<Response> {
    throw new Error("POST method not implemented");
  }

  // Handle PUT request
  public async put(req: Request): Promise<Response> {
    throw new Error("PUT method not implemented");
  }

  // Handle DELETE request
  public async delete(req: Request): Promise<Response> {
    throw new Error("DELETE method not implemented");
  }

  // Handle PATCH request
  public async patch(req: Request): Promise<Response> {
    throw new Error("PATCH method not implemented");
  }

  // Handle HEAD request
  public async head(req: Request): Promise<Response> {
    throw new Error("HEAD method not implemented");
  }

  // Handle OPTIONS request
  public async options(req: Request): Promise<Response> {
    throw new Error("OPTIONS method not implemented");
  }
}
