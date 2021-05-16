import { quelaag } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as express from "express";
import { Router } from "express";

// express's router also comes as its own package but it isn't type safe

const q = quelaag({
    cookies(req: express.Request): Record<string, string> {
        return cookie.parse(req.headers.cookie || "");
    }
});

const router = Router()
    .get("/", (req, res) => {
        const middleware = q(req, undefined);

        res.write(JSON.stringify(middleware.cookies()));
        res.statusCode = 200;
        res.end();
    });
