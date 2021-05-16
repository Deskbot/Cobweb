// you may want to write middleware to be imported into your application or other people's applications

// here's a contrived example

import { quelaag } from "quelaag";

/**
 * My middleware defined in a way that lets it be used anywhere.
 * All the direct dependencies are arguments.
 */
function getLastModified(headers: Record<string, string | string[]>): string {
    const header = headers["last-modified"];

    if (Array.isArray(header)) {
        return header[0];
    }

    return header;
}

/**
 * Usage of externally defined middleware.
 */
const q = quelaag({
    getLastModified(req): string {
        return getLastModified(this.headers(req))
    },

    headers(req): Record<string, string | string[]> {
        return req.headers;
    }
});
