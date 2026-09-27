export declare const generateOpenApiSpec: (title?: string, version?: string) => {
    openapi: string;
    info: {
        title: string;
        version: string;
    };
    paths: Record<string, any>;
};
