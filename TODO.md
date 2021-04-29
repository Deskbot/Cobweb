TODO
====

* add tests for whether files compile
* Generate documentation from TSDoc
* use a real test framework

* Problem: Defining endpoint "when"s could be simpler and more readable.
    * Solution A: Include simple predicates for checking the method and path.
    * Solution B: Have an alternative Endpoint syntax that has "method" and "path" attributes instead of "when".

* Problem: It's difficult to share data between the "when", "do", and "catch".
    * The obvious solution — to use middleware — may be not ideal if every endpoint has some data generation unique to it e.g. regex parsing of the URL.
        * Consider providing a wrapper for this: https://www.npmjs.com/package/path-to-regexp

    * Solution A: Have middleware definitions at the endpoint that make a subquelaag of the router Quelaag.
        * Con: calling router level middleware has to be done via context, so it will be mostly that way and possibly inconsistent if not all endpoints make a subquelaag.

    * Solution B: Have the endpoint optionally be provided by a function, so you can create something that implements the endpoint interface be initialised where the data is shared in a class way between the methods.
        * Con: This means people will have to use OO. Technically they don't but it might be neater to use class syntax than to write a function that returns an object of methods that share data.
            * This possibly isn't a con, but I don't want to be too prescriptive about the user's programming style.

    * Solution C: Each endpoint is just a single function that returns a `boolean | Promise<boolean>`; the boolean represents whether to continue trying to match endpoints.

* Add test for when a spy when rejects, keep on looking for more spies
* Add test for when an endpoint when rejects, stop looking for endpoints
