package main

// Create S2 cells from given geojson

import (
	"fmt"
	"os"
	"strconv"

	"github.com/golang/geo/s2"
	s2covergeojson "github.com/ponlawat-w/golang-s2covergeojson"
)

var precision = 19

var regionCoverer = s2.RegionCoverer{MinLevel: 1, MaxLevel: precision, MaxCells: 6000000}

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	featureCollection, err := s2covergeojson.ReadGeoJSON("regions.geojson")
	checkError(err)

	dirPath := "./out-s2-" + strconv.FormatInt(int64(precision), 10)

	_ = os.Mkdir(dirPath, 0644)
	_ = os.Mkdir(dirPath + "/temp", 0644)

	for _, feature := range featureCollection.Features {
		fmt.Printf("Converting %v...", feature.Properties["code"])
		cellUnions, err := s2covergeojson.Cover(feature, regionCoverer)
		checkError(err)

		err = s2covergeojson.WriteTokensToPath(cellUnions,
			fmt.Sprintf(dirPath + "/%v.s2cells", feature.Properties["code"]))
			checkError(err)
			
		err = s2covergeojson.WriteBase64TokensToPath(cellUnions,
			fmt.Sprintf(dirPath + "/temp/%v.s2cells-base64", feature.Properties["code"]))

		fmt.Println("OK");
	}
	fmt.Println("FINISHED");
}
