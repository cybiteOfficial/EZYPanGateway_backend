import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as multer from "multer";
import { documentMimeType, imageMimeType } from "./image.validation";
import * as path from "path";
import * as fs from "fs";
import * as uuid4 from "uuid4";
import * as sharp from "sharp";

@Injectable()
export class ImageMiddleware implements NestMiddleware {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        req.body = JSON.parse(JSON.stringify(req.body));
        const folderName = req.body.fileType;
        const new_file_path = path.join(
          __dirname,
          "../../",
          "public",
          "uploads",
          folderName
        );

        if (!fs.existsSync(new_file_path)) {
          fs.mkdirSync(new_file_path, { recursive: true });
        }

        cb(null, new_file_path);
      },
      filename: (req, file, cb) => {
        const uuid = uuid4();
        cb(null, file.fieldname + "-" + uuid + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const fileData = file.mimetype;
      const imgMimeType = imageMimeType();

      if (!imgMimeType.includes(fileData)) {
        return cb(new Error("Only image files are allowed!"));
      }
      cb(null, true);
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    try {
      req["body"] = req.body;
      this.upload.single("image")(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        } else {
          try {
            if (req.file !== undefined) {
              const filePath = req.file.path;
              let compressedImageBuffer = await sharp(filePath)
                // .resize({ width: 500, height: 500, fit: 'inside' })
                .jpeg({ quality: 80 })
                .toBuffer();
              fs.writeFileSync(filePath, compressedImageBuffer);

              compressedImageBuffer = Buffer.alloc(0);
              next();
            } else {
              next();
            }
          } catch (error) {
            return res.status(500).json({
              message: "Unable to upload images.",
              error: error.message,
            });
          }
        }
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Couldn't upload images.", error: error.message });
    }
  }
}

export class DocumentMiddleware implements NestMiddleware {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        req.body = JSON.parse(JSON.stringify(req.body));
        const folderName = req.body.fileType;
        const new_file_path = path.join(
          __dirname,
          "../../",
          "public",
          "uploads",
          folderName
        );

        if (!fs.existsSync(new_file_path)) {
          fs.mkdirSync(new_file_path, { recursive: true });
        }
        cb(null, new_file_path);
      },
      filename: (req, file, cb) => {
        const uuid = uuid4();
        cb(null, file.fieldname + "-" + uuid + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const fileData = file.mimetype;
      const doucumentMimeType = documentMimeType();

      if (!doucumentMimeType.includes(fileData)) {
        return cb(new Error("Only PDF file is allowed!"));
      }
      cb(null, true);
    },
  });

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      req["body"] = req.body;
      this.upload.single("file")(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        // else
        // {
        // if (req.file === undefined) {
        //   return res.status(200).send({
        //     status: false,
        //     message: 'File not found.',
        //   });
        // } else {

        //}
        // }
        next();
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Couldn't Upload Documents.", error: error.message });
    }
  }
}

export class MultipleDocumentMiddleware implements NestMiddleware {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        req.body = JSON.parse(JSON.stringify(req.body));
        const folderName = req.body.fileType;

        const new_file_path = path.join(
          __dirname,
          "../../",
          "public",
          "uploads",
          folderName
        );

        if (!fs.existsSync(new_file_path)) {
          fs.mkdirSync(new_file_path, { recursive: true });
        }
        cb(null, new_file_path);
      },
      filename: (req, file, cb) => {
        const uuid = uuid4();
        cb(null, file.fieldname + "-" + uuid + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const fileData = file.mimetype;
      const doucumentMimeType = documentMimeType();

      if (!doucumentMimeType.includes(fileData)) {
        return cb(new Error("Only PDF file is allowed!"));
      }
      cb(null, true);
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    req["body"] = req.body;

    const uploadFiles = this.upload.fields([
      { name: "file", maxCount: 1 },
      { name: "declarationForm", maxCount: 1 },
      // Add more fields as needed
    ]);

    uploadFiles(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const file1 = req.files["file"] ? req.files["file"][0] : "";
      const file2 = req.files["declarationForm"]
        ? req.files["declarationForm"][0]
        : "";

      // Update file1 path if it exists
      const image1 = file1 ? getFileImagePath(file1.path) : "";
      req["image1"] = image1;

      // Update file2 path if it exists
      const image2 = file2 ? getFileImagePath(file2.path) : "";
      req["image2"] = image2;

      next();
    });
  }
}

export class ImageAndDocumentMiddleware implements NestMiddleware {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        req.body = JSON.parse(JSON.stringify(req.body));
        const folderName = req.body.fileType;
        const new_file_path = path.join(
          __dirname,
          "../../",
          "public",
          "uploads",
          folderName
        );

        if (!fs.existsSync(new_file_path)) {
          fs.mkdirSync(new_file_path, { recursive: true });
        }

        cb(null, new_file_path);
      },
      filename: (req, file, cb) => {
        const uuid = uuid4();
        cb(null, file.fieldname + "-" + uuid + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const fileData = file.mimetype;
      const imgMimeType = imageMimeType();
      const docMimeType = documentMimeType();

      if (!imgMimeType.includes(fileData) && !docMimeType.includes(fileData)) {
        return cb(new Error("Invalid Document.!"));
      }
      // if (!docMimeType.includes(fileData)) {
      //   return cb(new Error("Invalid Document.....!"));
      // }
      cb(null, true);
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    try {
      req["body"] = req.body;
      this.upload.single("document")(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        } else {
          if (req.file !== undefined) {
            const filePath = req.file.path;
            const fileData = req.file.mimetype;
            const imgMimeType = imageMimeType();

            if (imgMimeType.includes(fileData)) {
              let compressedImageBuffer = await sharp(filePath)
                // .resize({ width: 500, height: 500, fit: 'inside' })
                .jpeg({ quality: 80 })
                .toBuffer();
              fs.writeFileSync(filePath, compressedImageBuffer);
              compressedImageBuffer = Buffer.alloc(0);
            }
            next();
          } else {
            next();
          }
        }
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Couldn't Upload Documents.", error: error.message });
    }
  }
}
function getFileImagePath(filePath: string): string {
  const fileImagePathArray = filePath.split("public");
  return `${process.env.LOCAL}public${
    fileImagePathArray[fileImagePathArray.length - 1]
  }`;
}
