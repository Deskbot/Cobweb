Cobweb
======

Tests
-----

Some tests deliberately do not close the requests that they send. And therefore a test process may take some time to close after all of the tests have been ran, while the connections wait to time out.