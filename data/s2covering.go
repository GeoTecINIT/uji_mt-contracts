package main

import (
	"fmt"
	"os"

	"github.com/golang/geo/s2"
	"github.com/ponlawat-w/golang-s2covergeojson"
)

var regionCoverer = s2.RegionCoverer{MinLevel: 1, MaxLevel: 14, MaxCells: 6000000}

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	featureCollection, err := s2covergeojson.ReadGeoJSON("regions.geojson")
	checkError(err)

	_ = os.Mkdir("./out", 0644)
	_ = os.Mkdir("./out/temp", 0644)

	for _, feature := range featureCollection.Features {
		fmt.Printf("Converting %v...", feature.Properties["code"])
		cellUnions, err := s2covergeojson.Cover(feature, regionCoverer)
		checkError(err)

		err = s2covergeojson.WriteTokensToPath(cellUnions,
			fmt.Sprintf("./out/%v.s2cells", feature.Properties["code"]))
			checkError(err)
			
		err = s2covergeojson.WriteBase64TokensToPath(cellUnions,
			fmt.Sprintf("./out/temp/%v.s2cells-base64", feature.Properties["code"]))

		fmt.Println("OK");
	}
	fmt.Println("FINISHED");
}
