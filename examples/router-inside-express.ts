import { quelaag, router } from "quelaag";
import * as cookie from "cookie"; // a third party cookie header parsing library
import * as express from "express";

const q = quelaag({
    cookies(req: express.Request): Record<string, string> {
        return cookie.parse(req.headers.cookie || "");
    }
});

const root = router<express.Request, express.Response, typeof q>(q);
root.addEndpoint({
    when: req => req.ip.endsWith("127.0.0.1"),
    do: (req, res, middleware) => {
        if (middleware.cookies().loggedIn) {
            res.json({ hello: "world" });
        }
    }
});

const app = express();
app.use((req, res, next) => {
    root.route(req, res);
    next();
});
app.listen(8081);
