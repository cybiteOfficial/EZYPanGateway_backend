import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ZipFile, ZipFileDocument } from './entities/create-zip.entity';
import { errorRes } from '../../helper/errorRes';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
/***/
import * as JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';
import * as axios from 'axios';

@Injectable()
export class ZipFileService {
  [x: string]: any;
  constructor(
    @InjectModel(ZipFile.name)
    private ZipFileModel: Model<ZipFileDocument>,
  ) {}

  //-------------------------------------------------------------------------
  /**
   * download zip of all files in application
   */
  //-------------------------------------------------------------------------

  async downloadZip(req, res) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let filesFound = await this.ZipFileModel.find();
      let currentUsed = filesFound.findIndex((el) => el.lastUsed);
      let nextIndex = currentUsed + 1;

      if (filesFound.length - 1 == currentUsed) {
        nextIndex = 0;
      }

      let fileToUse = filesFound[nextIndex];

      await this.ZipFileModel.updateOne(
        { lastUsed: true },
        { $set: { lastUsed: false } },
      );
      await this.ZipFileModel.updateOne(
        { _id: fileToUse._id },
        { $set: { lastUsed: true } },
      );

      let count = await this.ZipFileModel.find().count();

      // let updateLast

      //   const dataToArchive = [
      //     {
      //       url: fileToUse.filePath,
      //       fileName: 'passport-photo',
      //     },
      //     {
      //       url: fileToUse.filePath,
      //       fileName: 'adharcard-photo',
      //     },
      //     {
      //       url: fileToUse.filePath,
      //       fileName: 'pan-card-photo',
      //     },
      //   ];
      //   if (applicationFound.otherDocuments.length) {
      //     const otherFileData = applicationFound.otherDocuments.reduce(
      //       (acc, ele) => {
      //         dataToArchive.push({
      //           url: ele.imageUrl,
      //           fileName: ele.title,
      //         });

      //         return acc;
      //       },
      //       [],
      //     );
      //   }

      //   const filterdData = dataToArchive.filter((el) => {
      //     return (
      //       el.url !== '' &&
      //       el.url !== null &&
      //       el.url !== undefined &&
      //       el.fileName !== '' &&
      //       el.fileName !== null &&
      //       el.fileName !== undefined
      //     );
      //   });

      // Create a new instance of JSZip
      const zip = new JSZip();

      // Loop through the array of URLs
      for (const each in filesFound) {
        const url = filesFound[each].filePath;

        const filePathSplit = url.split('.');
        const fileExt = filePathSplit.pop();
        const fileName = url.split('/').pop();
        // Use axios to download the file
        const response = await axios.default.get(url, {
          responseType: 'arraybuffer',
        });

        // Add the file to the zip archive
        const filename = path.basename(url); // Extract the filename from the URL
        zip.file(filename, response.data);
      }

      // Generate the zip archive
      const zipData = await zip.generateAsync({ type: 'nodebuffer' });

      // let folderPath = `${ process.env.LOCAL }public/zip-folder`;

      // Create a temporary file to hold the zip archive
      const folderPath = path.join(
        __dirname,
        '../../..',
        'public',
        'zip-folder',
      );

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const zipfileName = 'files';

      const tempFilePath = path.join(folderPath, `${zipfileName}.zip`);

      fs.writeFileSync(tempFilePath, zipData);

      const path_array = tempFilePath.split('public');
      const newFolderPath = `${process.env.LOCAL}public${
        path_array[path_array.length - 1]
      }`;

      // Send the file to the client for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=archive.zip');

      // let folderPath = `${ process.env.LOCAL }public/zip-folder`;

      // Delete the temporary file

      return res.status(200).send({
        message: 'Zip created.',
        status: true,
        data: newFolderPath,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
