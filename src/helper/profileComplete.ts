import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../api/user/entities/user.entity';
import * as moment from 'moment';

export class checkProfile
{
  [ x: string ]: any;
  constructor ( @InjectModel( User.name ) private userModel: Model<UserDocument> ) { }

  async checkProfile ( userData: any )
  {
    let resToSend = { status: false };
    if (
      userData.name === '' ||
      userData.dob === '' ||
      userData.email === '' ||
      userData.mobileNumber === ''
    )
    {
      resToSend = { status: false };
    } else
    {
      resToSend = { status: true };
    }

    return resToSend;
  }

  async generateSJBTCode ( name, fatherName, dob )
  {
    let concateName = name.concat( fatherName );
    concateName = concateName.toUpperCase().replace( / /g, '' );
    const timestamp = moment( dob ).format( 'DDMM' );
    let randomChars, regex, randomExist;
    do
    {
      randomChars = Array.from( { length: 4 }, () =>
      {
        const randomIndex = Math.floor( Math.random() * ( 10 + 26 + 26 ) );
        if ( randomIndex < 10 )
        {
          return String.fromCharCode( randomIndex + 48 );
        } else if ( randomIndex < 36 )
        {
          return String.fromCharCode( randomIndex + 65 - 10 );
        } else
        {
          return String.fromCharCode( randomIndex + 97 - 36 );
        }
      } ).join( '' );

      regex = new RegExp( randomChars + '$' );
      randomExist = await this.userModel.findOne( { sjbtCode: regex } );
    } while ( randomExist );

    const result = `EZY${ concateName
      .toUpperCase()
      .substring( 0, 4 ) }${ timestamp }${ randomChars.toUpperCase() }`;
    return result;
  }
}
