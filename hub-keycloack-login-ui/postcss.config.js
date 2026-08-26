import postcssGlobalData from "@csstools/postcss-global-data"
import postcssCustomMedia from "postcss-custom-media"

const postcss = () => {
  return {
    plugins: [
      postcssGlobalData({
        files: ["./src/css/breakpoints.css"]
      }),
      postcssCustomMedia()
    ]
  }
}

export default postcss
