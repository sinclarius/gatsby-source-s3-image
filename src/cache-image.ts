import axios from 'axios'
import crypto from 'crypto'
import { createWriteStream, pathExists } from 'fs-extra'
import path from 'path'

export const cacheImage = async (store, image, options): Promise<any> => {
  const program = store.getState().program
  const CACHE_DIR = path.resolve(`${program.directory}/.cache/image-s3/assets/`)
  const {
    file: { url, fileName, details },
  } = image
  const {
    width,
    height,
    maxWidth,
    maxHeight,
    resizingBehavior,
    cropFocus,
    background,
  } = options
  const userWidth = maxWidth || width
  const userHeight = maxHeight || height

  const aspectRatio = details.image.height / details.image.width
  const resultingWidth = Math.round(userWidth || 800)
  const resultingHeight = Math.round(userHeight || resultingWidth * aspectRatio)

  const params = [`w=${resultingWidth}`, `h=${resultingHeight}`]
  if (resizingBehavior) {
    params.push(`fit=${resizingBehavior}`)
  }
  if (cropFocus) {
    params.push(`crop=${cropFocus}`)
  }
  if (background) {
    params.push(`bg=${background}`)
  }

  const optionsHash = crypto
    .createHash(`md5`)
    .update(JSON.stringify([url, ...params]))
    .digest(`hex`)

  const { name, ext } = path.parse(fileName)
  const absolutePath = path.resolve(CACHE_DIR, `${name}-${optionsHash}${ext}`)

  const alreadyExists = await pathExists(absolutePath)

  if (!alreadyExists) {
    const previewUrl = `http:${url}?${params.join(`&`)}`

    const response = await axios({
      method: `get`,
      responseType: `stream`,
      url: previewUrl,
    })

    return new Promise((resolve, reject) => {
      const file = createWriteStream(absolutePath)
      response.data.pipe(file)
      file.on(`finish`, resolve)
      file.on(`error`, reject)
    })
  }

  return absolutePath
}
