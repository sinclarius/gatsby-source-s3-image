import exif from 'exif-parser';
import fs from 'fs';
import _ from 'lodash';
import { DateTime } from 'luxon';
import ExifDataType from './types/exif-data';
import S3ImageAssetNode from './types/s3-image-asset-node';

const {
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} = require('gatsby/graphql')

export const resolveExifData = (image: S3ImageAssetNode): ExifDataType => {
  console.log('resolve exif data', { image })
  const file = fs.readFileSync(image.absolutePath)
  const tags = exif.create(file).parse().tags
  const timestamp = tags.DateTimeOriginal * 1000
  const DateCreatedISO = DateTime.fromMillis(timestamp).toISODate()
  return {
    DateCreatedISO,
    ..._.pick(tags, [
      'DateTimeOriginal',
      'ExposureTime',
      'FNumber',
      'FocalLength',
      'ISO',
      'LensModel',
      'Model',
      'ShutterSpeedValue',
    ]),
  }
}

export interface ExtendNodeTypeOptions {
  type: {
    name: string
    nodes: any
  }
}

export default ({
  type,
  // pathPrefix,
  // getNodeAndSavePathDependency,
  // reporter,
  // name,
  // cache,
}) => {
  if (type.name !== 'S3ImageAsset') {
    return {}
  }

  const ExifData = {
    resolve: image => {
      // tslint:disable
      console.log({ image })
      // console.log('resolve exif data')
      // const file = getNodeAndSavePathDependency(image.parent, context.path)
      // const args = { ...fieldArgs }

      return {
        ...type,
        ...resolveExifData(image),
      }
    },
    type: new GraphQLObjectType({
      fields: {
        DateCreatedISO: { type: GraphQLString },
        DateTimeOriginal: { type: GraphQLInt },
        ExposureTime: { type: GraphQLFloat },
        FNumber: { type: GraphQLFloat },
        FocalLength: { type: GraphQLFloat },
        ISO: { type: GraphQLInt },
        LensModel: { type: GraphQLString },
        Model: { type: GraphQLString },
        ShutterSpeedValue: { type: GraphQLFloat },
      },
      name: 'EXIF',
    }),
  }

  return Promise.resolve({
    EXIF: {
      type: new GraphQLObjectType({
        fields: {
          ETag: { type: GraphQLString },
          EXIF: ExifData,
          Key: { type: GraphQLString },
        },
        name: 'S3ImageAssetExifData',
      }),
    },
  })
  // return Promise.resolve({
  //   type: new GraphQLObjectType({
  //     name: 'ExifData',
  //     fields: {
  //       ETag: { type: GraphQLString },
  //       EXIF: ExifData,
  //       Key: { type: GraphQLString },
  //     },
  //     // resolve(image: S3ImageAssetNode) {
  //     //   return Promise.resolve({
  //     //     ...type,
  //     //     ...resolveExifData(image),
  //     //   })
  //     // },
  //   }),
}

// return {
//   type: new GraphQLObjectType({
//     name: 'ExifData',
//     // tslint:disable-next-line
//     fields: {
//       ETag: { type: GraphQLString },
//       EXIF: {
//         DateCreatedISO: { type: GraphQLString },
//         DateTimeOriginal: { type: GraphQLInt },
//         ExposureTime: { type: GraphQLFloat },
//         FNumber: { type: GraphQLFloat },
//         FocalLength: { type: GraphQLFloat },
//         ISO: { type: GraphQLInt },
//         LensModel: { type: GraphQLString },
//         Model: { type: GraphQLString },
//         ShutterSpeedValue: { type: GraphQLFloat },
//       },
//       Key: { type: GraphQLString },
//     },
//     // resolve: image => {
//     //   console.log('resolve', { image })
//     //   // const file = getNodeAndSavePathDependency(image.parent, context.path)
//     //   // const args = { ...fieldArgs, pathPrefix }
//     //   return Promise.resolve({
//     //     ...type,
//     //     ...resolveExifData(image),
//     //   })
//     //   // return {
//     //   //   ...type,
//     //   //   ...resolveExifData(image),
//     //   // }
//     // },
//   }),
// }

// export const setFieldsOnGraphQLNodeType = ({ type }): any => {
//   if (type.name !== 'S3ImageAsset') {
//     return {}
//   }

//   console.log('extend node type', stringify(type))
//   return {
//     type: {
//       ETag: { type: GraphQLString },
//       EXIF: {
//         resolve: image => {
//           console.log('resolve', { image })
//           return {
//             ...type,
//             ...resolveExifData(image),
//           }
//         },
//         type: new GraphQLObjectType({
//           ExifData: {
//             DateCreatedISO: { type: GraphQLString },
//             DateTimeOriginal: { type: GraphQLInt },
//             ExposureTime: { type: GraphQLFloat },
//             FNumber: { type: GraphQLFloat },
//             FocalLength: { type: GraphQLFloat },
//             ISO: { type: GraphQLInt },
//             LensModel: { type: GraphQLString },
//             Model: { type: GraphQLString },
//             ShutterSpeedValue: { type: GraphQLFloat },
//           },
//         }),
//         // resolve(image: S3ImageAssetNode) {
//       },
//       Key: { type: GraphQLString },
//     },
//     name: 'ExifData',
//   }
// }
