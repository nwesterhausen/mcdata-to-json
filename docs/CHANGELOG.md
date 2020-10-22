# [1.0.0](https://github.com/nwesterhausen/mcdata-to-json/compare/v0.6.2...v1.0.0) (2020-10-22)


### Bug Fixes

* change paths re [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22) ([322b0bf](https://github.com/nwesterhausen/mcdata-to-json/commit/322b0bfc620979f223e44cf047ea47dd3b20e905))
* mcaparser handles "empty" region files ([495ac4e](https://github.com/nwesterhausen/mcdata-to-json/commit/495ac4e2ce6364bf5cb1370e4cc71ba124af97a4))
* McaParser works again ([84da962](https://github.com/nwesterhausen/mcdata-to-json/commit/84da962214efb8f76a731eece63016a5e118309a))
* new path conformity ([49844a2](https://github.com/nwesterhausen/mcdata-to-json/commit/49844a25b6734c562811c44f5c8f9e4f8f209e6d)), closes [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22) [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22)
* no more .temp inside cache ([22ed968](https://github.com/nwesterhausen/mcdata-to-json/commit/22ed968a5dd34728bc8cc350fe3fbe929c39a2f4)), closes [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22)
* refactored promises ([0007692](https://github.com/nwesterhausen/mcdata-to-json/commit/000769208b17621206a2d7e72611aced8bb1eb71))
* remove type_overloaded log messages from final.json ([669f0da](https://github.com/nwesterhausen/mcdata-to-json/commit/669f0da2f3bc1d476f2e03bad7b5045a73256b97))
* save tile entities JSON to subdir ([39b68f4](https://github.com/nwesterhausen/mcdata-to-json/commit/39b68f4c907e955482f7ede3d5b8489c0e11c408))
* **path:** use new path structure ([d3b9b4e](https://github.com/nwesterhausen/mcdata-to-json/commit/d3b9b4ebc137f679ee39cb70b36f8ed50bdfa2ae)), closes [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22)
* **paths:** modified exported paths ([b216db8](https://github.com/nwesterhausen/mcdata-to-json/commit/b216db8c15ee0a1995730dd414836bb170c2d53d)), closes [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22) [#22](https://github.com/nwesterhausen/mcdata-to-json/issues/22)


### Code Refactoring

* promises improvement ([8d4359f](https://github.com/nwesterhausen/mcdata-to-json/commit/8d4359fa1bb9ba42a0c337ca9cb9de7317aadfd0))


### BREAKING CHANGES

* Changes save location of tile entity JSON
* If no extracted data, it will extract data and exit, requiring you to run it again.

## [0.6.2](https://github.com/nwesterhausen/mcdata-to-json/compare/v0.6.1...v0.6.2) (2020-10-15)

### Performance Improvements

- import shuffle ([8ab1539](https://github.com/nwesterhausen/mcdata-to-json/commit/8ab153948b475deace882dab829670bf4dbdbbcc))

## [0.6.1](https://github.com/nwesterhausen/mcdata-to-json/compare/v0.6.0...v0.6.1) (2020-10-15)

### Bug Fixes

- **mcaparsing:** parse all dimension ([c245f38](https://github.com/nwesterhausen/mcdata-to-json/commit/c245f38069c695baba22353ef15961c2b4007369)), closes [#14](https://github.com/nwesterhausen/mcdata-to-json/issues/14)
- path constant changed ([3cff339](https://github.com/nwesterhausen/mcdata-to-json/commit/3cff33977cca8bc9864747226fe253805b094eee))

# [0.6.0](https://github.com/nwesterhausen/mcdata-to-json/compare/v0.5.0...v0.6.0) (2020-10-14)

### Bug Fixes

- create dirs if needed ([fa815df](https://github.com/nwesterhausen/mcdata-to-json/commit/fa815df4872bf2459dc9a644a8363ee594faeda3))

### Features

- **data-extraction:** extract data from server.jar ([efa9ad5](https://github.com/nwesterhausen/mcdata-to-json/commit/efa9ad5ac5e09c76a50e770ecd82dfee2e7b4d93)), closes [#11](https://github.com/nwesterhausen/mcdata-to-json/issues/11) [#11](https://github.com/nwesterhausen/mcdata-to-json/issues/11)

# [0.5.0](https://github.com/nwesterhausen/mcdata-to-json/compare/v0.4.0...v0.5.0) (2020-10-14)

### Features

- **dat parsing:** parse level.dat ([2328dbd](https://github.com/nwesterhausen/mcdata-to-json/commit/2328dbd1d134d80157a6e806227936e910e5218c)), closes [#13](https://github.com/nwesterhausen/mcdata-to-json/issues/13)
