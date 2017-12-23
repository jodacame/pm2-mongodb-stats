# pm2-mongodb-stats

[![NPM](https://nodei.co/npm/pm2-mongodb-stats.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/pm2-mongodb-stats/)

![alt text](https://david-dm.org/jodacame/pm2-mongodb-stats.svg "Dependencies Status")
[![Maintainability](https://api.codeclimate.com/v1/badges/c257bbe7c9cad9aea555/maintainability)](https://codeclimate.com/github/jodacame/pm2-mongodb-stats/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/c257bbe7c9cad9aea555/test_coverage)](https://codeclimate.com/github/jodacame/pm2-mongodb-stats/test_coverage)


PM2 MongoDB Stats Metrics

* MongoDB Version
* Uptime
* Queries, input, updates, deletes (AVG per second)
* Number of connections
* Connections per seconds
* Network speed (input and output)

![Screenshot](https://raw.githubusercontent.com/jodacame/pm2-mongodb-stats/master/capture.png)


### Install

```bash
pm2 install jodacame/pm2-mongodb-stats
```

or

```bash
pm2 install pm2-mongodb-stats
```

### Uninstall

```bash
pm2 uninstall jodacame/pm2-mongodb-stats
```

or

```bash
pm2 uninstall pm2-mongodb-stats
```

### Set mongo connection (Optional)
```bash
pm2 set pm2-mongodb-stats:mongo <string connection>
```

**Example:**

```bash
pm2 set pm2-mongodb-stats:mongo 'mongodb://localhost:27017/admin'
```

### Required

* pm2
```bash
npm install pm2 -g
```
* mongodb
```bash
npm mongodb pm2 -g
```
