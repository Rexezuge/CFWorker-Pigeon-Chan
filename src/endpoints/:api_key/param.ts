import { ParameterObject } from "chanfana";

export const apiKeyParam: ParameterObject = {
    name: "api_key",
    in: "path",
    required: true,
    schema: {
        type: "string",
    },
    description: "User's API Key",
};
