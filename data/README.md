To reproduce the experiment data, it is needed to run the following:

**※ `.js` should be executed from repository root directory, `.go` should be executed from this directory.**

---

## 1. Geohash
```
node ./data/geohash.js
```

---

## 2. S2

### 2.1. Cells
```
go run ./s2covering.go
```

### 2.2. Tree
```
node ./data/s2base64tree.js
```

---
