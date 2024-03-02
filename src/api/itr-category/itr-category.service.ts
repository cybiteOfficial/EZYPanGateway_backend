import { CreateItrCategoryDto } from './dto/create-itr-category.dto';
import { UpdateItrCategoryDto } from './dto/update-itr-category.dto';
import {
  ItrCategory,
  ItrCategoryDocument,
} from './entities/itr-category.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { errorRes } from '../../helper/errorRes';
import mongoose, { Model } from 'mongoose';
import { AddLogFunction } from '../../helper/addLog';
import * as moment from 'moment';
import { Role } from '../user/entities/user.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, adminDocument } from '../admin/entities/admin.entity';

@Injectable()
export class ItrCategoryServices {
  [x: string]: any;
  [x: number]: any;
  constructor(
    @InjectModel(ItrCategory.name)
    private ItrCategoryModel: Model<ItrCategoryDocument>,
    @InjectModel(Admin.name) private adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create pan-category
   */
  //-------------------------------------------------------------------------

  async add(createItrCategoryDto: CreateItrCategoryDto, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      // const checkcategory = await this.ItrCategoryModel.findOne({
      //   categoryCode: req.body.categoryCode,
      //   isActive: true,
      // });

      // if (checkcategory) {
      //   throw new HttpException('Category already exist.', HttpStatus.OK);
      // }

      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const model = await new this.ItrCategoryModel();
      model.categoryName = createItrCategoryDto.categoryName;
      model.categoryCode = createItrCategoryDto.categoryCode;
      model.price = createItrCategoryDto.price;

      const result = await model.save();

      if (!result) {
        throw new HttpException('Unable to add category.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'ITR_CATEGORY',
        'ITR_CATEGORY_ADD',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } added Itr category at ${currentDate}.`,
        'ITR category added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'ITR category added successfully.',
        status: true,
        data: result,
        code: 'CREATED',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to add Itr category with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //   //-------------------------------------------------------------------------
  //   /***
  //    * update user
  //    */
  //   //-------------------------------------------------------------------------

  async update_by_id(
    id: string,
    UpdateItrCategoryDto: UpdateItrCategoryDto,
    res,
    req,
  ) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.ItrCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isActive: true,
      });

      if (!categoryExist) {
        throw new HttpException('Category not found.', HttpStatus.OK);
      }
      if (UpdateItrCategoryDto.categoryCode) {
        throw new HttpException(
          'Could not update category code.',
          HttpStatus.OK,
        );
      }

      const result = await this.ItrCategoryModel.findByIdAndUpdate(
        { _id: categoryExist._id },
        {
          $set: { ...req.body },
        },
        { new: true },
      );

      if (!result) {
        throw new HttpException('Could not update category.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'ITR_CATEGORY',
        'ITR_CATEGORY_UPDATE',
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } updated Itr category ${id} at ${currentDate}.`,
        'ITR category updated successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Category updated successfully.',
        status: true,
        data: result,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_UPDATE',
        id,
        errData.resData.status,
        errData.statusCode,
        `${
          req.userData?.type || ''
        } tried to update ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  async list(res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');

      let query: any = {
        isActive: [true, false],
      };

      if (!req.route.path.includes('/admin/')) {
        query = {
          isActive: true,
        };
      }

      /**project query for admin role */
      let projectData = {};
      if (req.headers['x-access-token'] && req.userData.type === 'ADMIN') {
        let role = await this.adminModel.findOne({
          _id: req.userData.Id,
          isDeleted: false,
        });
        let roleName = role.adminRoleGroupName;
        const accessFields = await this.userAuthHelper.getAccessFields(
          roleName,
          'ITR_CATEGORIES',
        );
        if (!accessFields.length) {
          throw new HttpException(
            `You don't have access to this module.`,
            HttpStatus.OK,
          );
        }
        const projectQuery = await this.userAuthHelper.projectQuery(
          accessFields,
        );
        projectData = projectQuery;
      }
      const dataFound = await this.ItrCategoryModel.find({
        ...query,
        projectData,
      });

      if (!dataFound.length) {
        throw new HttpException('Categories not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'ITR_CATEGORY',
        'ITR_CATEGORY_LIST',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of ITR category at ${currentDate}.`,
        'Data found successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'Categories found successfully.',
        status: true,
        data: dataFound,
        code: 'OK',
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of ITR category with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * changeActiveStatus
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.ItrCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = categoryExist.isActive === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.ItrCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isActive: activeStatus } },
        { new: true },
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'ITR_CATEGORY',
          'ITR_CATEGORY_STATUS',
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } change status of ITR category ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of ITR category ${id} successfully.`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Status changed to ${statusValue} successfully.`,
          status: true,
          data: null,
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of ITR ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * change status changeShowForGuest
   */
  //-------------------------------------------------------------------------

  async changeShowForGuest(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.ItrCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = categoryExist.showForGuest === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.ItrCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: { showForGuest: activeStatus },
        },
        { new: true },
      );

      if (statusChanged.showForGuest === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'ITR_CATEGORY',
          'ITR_CATEGORY_STATUS',
          id,
          true,
          200,
          `${requestedType} ${req.userData?.contactNumber || ''} change 
          showForGuest status of Itr category ${id} at ${currentDate}.`,
          `Changed 
          showForGuest status to ${activeStatus} of Itr category ${id} successfully.`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Show for Guest tatus changed to ${statusValue} successfully.`,
          status: true,
          data: null,
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of Itr ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  //-------------------------------------------------------------------------
  /***
   * change status changeapplicableForMinorStatus
   */
  //-------------------------------------------------------------------------

  async changeapplicableForMinorStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.ItrCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus =
        categoryExist.applicableForMinor === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.ItrCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { applicableForMinor: activeStatus } },
        { new: true },
      );

      if (statusChanged.applicableForMinor === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'ITR_CATEGORY',
          'ITR_CATEGORY_APPLICABLE_FOR_MINOR_STATUS',
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } change status of applicable for minor ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of applicable for minor ${id} successfully.`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Applicable for minor Status changed to ${statusValue} successfully.`,
          status: true,
          data: null,
          code: 'OK',
          issue: null,
        });
      } else {
        throw new HttpException(`Something went wrong.`, HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || '',
        req.userData?.Id || '',
        'ITR_CATEGORY',
        'ITR_CATEGORY_APPLICABLE_FOR_MINOR_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of applicable for minor ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
