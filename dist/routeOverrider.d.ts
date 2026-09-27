import type { RequestHandler } from 'express';
import { ZodType } from 'zod';
export interface RouteDefinition {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    path: string;
    params?: ZodType;
    query?: ZodType;
    body?: ZodType;
    summary?: string;
    handler: RequestHandler;
}
export declare const routeRegistry: RouteDefinition[];
export declare const createDocRouter: () => import("express-serve-static-core").Router;
