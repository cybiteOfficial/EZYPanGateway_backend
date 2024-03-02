import { CreatePanCategoryDto } from './dto/create-pan-category.dto';
import { UpdatePanCategoryDto } from './dto/update-pan-category.dto';
import {
  PanCategory,
  PanCategoryDocument,
} from './entities/pan-category.entity';
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
export class PanCategoryServices {
  [x: string]: any;
  [x: number]: any;
  constructor(
    @InjectModel(PanCategory.name)
    private PanCategoryModel: Model<PanCategoryDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly userAuthHelper: userAuthHelper,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create pan-category
   */
  //-------------------------------------------------------------------------

  async add(createPanCategoryDto: CreatePanCategoryDto, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const result = await new this.PanCategoryModel(
        createPanCategoryDto,
      ).save();

      if (!result) {
        throw new HttpException('Unable to add category.', HttpStatus.OK);
      }

      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'PAN_CATEGORY',
        'PAN_CATEGORY_ADD',
        result._id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } added PAN category at ${currentDate}.`,
        'PAN category added successfully.',
        req.socket.remoteAddress,
      );
      return res.status(200).send({
        message: 'category added successfully.',
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_ADD',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to add PAN category with this credentials at ${moment()
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
   * update user
   */
  //-------------------------------------------------------------------------

  async update_by_id(
    id: string,
    UpdatePanCategoryDto: UpdatePanCategoryDto,
    req: any,
    res,
  ) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.PanCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isActive: true,
      });

      if (!categoryExist) {
        throw new HttpException('Category not found.', HttpStatus.OK);
      }

      if (UpdatePanCategoryDto.categoryCode) {
        throw new HttpException(
          'Could not update category code.',
          HttpStatus.OK,
        );
      }

      const checkCategoryName = await this.PanCategoryModel.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        categoryName: req.body.categoryName,
      });

      if (checkCategoryName) {
        throw new HttpException(
          'Category name already exist with another category.',
          HttpStatus.OK,
        );
      }

      if (req.userData.type !== 'SUPER_ADMIN') {
        throw new HttpException(
          'You do not have authority to update category.',
          HttpStatus.OK,
        );
      }
      const result = await this.PanCategoryModel.findByIdAndUpdate(
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_UPDATE',
        id,
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } updated PAN category ${id} at ${currentDate}.`,
        'PAN category updated successfully.',
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_UPDATE',
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

      const query: any = [];
      let matchQuery = {};
      const projectQuery = {};
      matchQuery = {
        $match: {
          isActive: {
            $in: [true, false],
          },
        },
      };
      query.push(matchQuery);

      if (!req.route.path.includes('/admin/')) {
        matchQuery = {
          $match: {
            isActive: true,
          },
        };
      }

      if (requestedType == Role.GUEST) {
        matchQuery = {
          $match: {
            isActive: true,
            showForGuest: true,
          },
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
          'PAN_CATEGORIES',
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

      const dataFound = await this.PanCategoryModel.find(
        { ...query },
        projectData,
      );

      if (!dataFound.length) {
        throw new HttpException('Categories not found.', HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        'PAN_CATEGORY',
        'PAN_CATEGORY_LIST',
        '',
        true,
        200,
        `${requestedType} ${
          req.userData?.contactNumber || ''
        } checked list of PAN category at ${currentDate}.`,
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_LIST',
        '',
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to check list of PAN category with this credentials at ${moment()
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
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  async changeActiveStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.PanCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = categoryExist.isActive === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.PanCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isActive: activeStatus } },
        { new: true },
      );

      if (statusChanged.isActive === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'PAN_CATEGORY',
          'PAN_CATEGORY_STATUS',
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } change status of PAN category ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of PAN category ${id} successfully.`,
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of PAN ${id} with this credentials at ${moment()
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
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  async changeShowForGuest(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.PanCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus = categoryExist.showForGuest === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.PanCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { showForGuest: activeStatus } },
        { new: true },
      );

      if (statusChanged.showForGuest === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'PAN_CATEGORY',
          'PAN_CATEGORY_SHOW_FOR_GUEST_STATUS',
          id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ''
          } change status of show for guest  ${id} at ${currentDate}.`,
          `Changed status to ${activeStatus} of show for guest ${id} successfully.`,
          req.socket.remoteAddress,
        );
        return res.status(200).send({
          message: `Show for guest status changed to ${statusValue} successfully.`,
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_SHOW_FOR_GUEST_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of PAN ${id} with this credentials at ${moment()
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
   * change status of Gallery
   */
  //-------------------------------------------------------------------------

  async changeapplicableForMinorStatus(id: string, res, req) {
    try {
      const requestedId = req.userData?.Id || '';
      const requestedType = req.userData?.type || '';
      const currentDate = moment()
        .utcOffset('+05:30')
        .format('YYYY-MM-DD HH:mm:ss');
      const categoryExist = await this.PanCategoryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      });

      if (!categoryExist) {
        throw new HttpException(`Data not found.`, HttpStatus.OK);
      }

      const activeStatus =
        categoryExist.applicableForMinor === true ? false : true;
      const statusValue = activeStatus === true ? 'ACTIVE' : 'DEACTIVE';

      const statusChanged = await this.PanCategoryModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { applicableForMinor: activeStatus } },
        { new: true },
      );

      if (statusChanged.applicableForMinor === activeStatus) {
        this.addLogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          'PAN_CATEGORY',
          'PAN_CATEGORY_APPLICABLE_FOR_MINOR_STATUS',
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
          message: `Applicable for minor status changed to ${statusValue} successfully.`,
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
        'PAN_CATEGORY',
        'PAN_CATEGORY_APPLICABLE_FOR_MINOR_STATUS',
        id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ''} ${
          req.userData?.contactNumber || ''
        } tried to change status of applicable for minon ${id} with this credentials at ${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm:ss')}.`,
        errData.resData.message,
        req.socket.remoteAddress,
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
