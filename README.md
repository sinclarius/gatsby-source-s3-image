## gatsby-source-s3-image

[![CircleCI][circleci-badge]][circleci-link]
[![npm][npm-badge]][npm-link]
[![Maintainability][codeclimate]][codeclimate 2]

GatsbyJS Source plugin for **converting images from an S3-compliant API[1] into
GatsbyJS nodes** (with full support for hooking into all of the powerful features
the `GatsbyImage` API has to offer).

Additionally, `gatsby-source-s3-image` will **automatically detect and extract image
EXIF metadata from your photos**, and expose this data at the GraphQL layer as
node fields. Currently supported EXIF fields include:

- `DateCreatedISO` (String)
- `DateTimeOriginal` (Number)
- `ExposureTime` (Number)
- `FNumber` (Number)
- `FocalLength` (Number)
- `ISO` (Number)
- `LensModel` (String)
- `Model` (String)
- `ShutterSpeedValue` (Number)

These fields are properties of the "wrapper" node, `S3ImageAsset`. This type
composes the `ImageSharp` node, the `File` node representing the cached image on
disk (fetched via the `RemoteFileNode` API), and lastly the extracted EXIF data.
As a result, you can easily retrieve both a set of images as well as any subset
of their associated metadata in a single request. For example:

```es6
export const pageQuery = graphql`
  query PhotographyPostsQuery {
    allS3ImageAsset {
      edges {
        node {
          id
          EXIF {
            DateCreatedISO
            ExposureTime
            FNumber
            ShutterSpeedValue
          }
          childImageSharp {
            original {
              height
              width
            }
            thumbnailSizes: sizes(maxWidth: 512) {
              aspectRatio
              src
              srcSet
              sizes
            }
            largeSizes: sizes(maxWidth: 1536) {
              aspectRatio
              src
              srcSet
              sizes
            }
          }
        }
      }
    }
  }
`
```

[1]: This includes AWS S3, of course, as well as third-party solutions like
     Digital Ocean Spaces, or open source / self-hosted products like Minio.

### Setup

1. Add the dependency to your `package.json`:

```console
$ yarn add gatsby-source-s3-image
$ # Or:
$ npm install --save gatsby-source-s3-image
``````

1. Next, register the plugin with the GatsbyJS runtime in the `plugins` exported
   from your `gatsby-config.js` file, filling in the values to point to wherever
   your bucket is hosted:

```es6
const sourceS3 = {
  resolve: 'gatsby-source-s3-image',
  options: {
    bucketName: 'jesse.pics',
    domain: null, // Not necessary to define here for AWS S3; defaults to `s3.amazonaws.com`
    protocol: 'https',
  },
}

const plugins = [
  sourceS3,
  // ...
]

module.exports = { plugins }
```
### Querying

1. As mentioned above, `gatsby-source-s3-image` exposes nodes of type
   `S3ImageAsset`:

```flow
type S3ImageAssetNode = {
  id: String,
  absolutePath: String,
  ETag: String,
  Key: String,
  EXIF: ?ExifData, // ExifData is defined below -->
  internal: {
    content: String,
    contentDigest: String,
    mediaType: String,
    type: String,
  },
}

type ExifData = {
  DateCreatedISO: String,
  DateTimeOriginal: Number,
  ExposureTime: Number,
  FNumber: Number,
  FocalLength: Number,
  ISO: Number,
  LensModel: String,
  Model: String,
  ShutterSpeedValue: Number,
}
```

Not only can this be used to populate page data, I've found it useful in
bootstrapping the pages themselves, e.g., to dynamically create dynamic photo
gallery pages at build time depending on the contents of a bucket,
something like:

```es6
// In `gatsby-node.js` -- using a query like this:
const photographyQuery = `{
  allS3ImageAsset {
    edges {
      node {
        ETag
        EXIF {
          DateCreatedISO
        }
      }
    }
  }
}`

// We can then dynamically generate pages based on EXIF data, like this:
const createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators
  const photographyTemplate = path.resolve('./src/templates/photography-post.js')

  const createPhotographyPosts = edges => {
    // Create the photography "album" pages -- these are a collection of photos
    // grouped by ISO date.
    const imagesGroupedByDate = _.groupBy(edges, 'node.EXIF.DateCreatedISO')
    _.each(imagesGroupedByDate, (images, date) => {
      createPage({
        path: `/photography/${date}`,
        component: photographyTemplate,
        context: {
          name: date,
          datetime: DateTime.fromISO(date),
          type: PageType.Photography,
        },
      })
    })
  }
}
```

[codeclimate]: https://api.codeclimate.com/v1/badges/4488634e45e84d3cbdbe/maintainability
[codeclimate 2]: https://codeclimate.com/github/jessestuart/gatsby-source-s3-image/maintainability
[circleci-badge]: https://circleci.com/gh/jessestuart/gatsby-source-s3-image.svg?style=shield
[circleci-link]: https://circleci.com/gh/jessestuart/gatsby-source-s3-image
[npm-badge]: https://img.shields.io/npm/v/gatsby-source-s3-image.svg
[npm-link]: https://www.npmjs.com/package/gatsby-source-s3-image
