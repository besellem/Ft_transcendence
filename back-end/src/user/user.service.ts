import { Injectable, HttpException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { UserDto, LimitedUserDto, HistoryDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
	
	constructor(
		@InjectRepository(UserEntity)
		private usersRepository: Repository<UserEntity>
	) {}

	async createUser(user: LimitedUserDto) : Promise<UserDto> {
		
		await this._checkNewUserName(user.name);
		
		console.log(`Creating profile: login:${user.login} name:${user.name}`)

		let newUser : UserDto = {
			...user,
			id: uuid(), // TODO: change to 42 id
			login: '',
			avatar: '',
			fortyTwoAvatar: `https://cdn.intra.42.fr/users/${user.login}.jpg`,
			email: `${user.login}@student.42.fr`
		}
		return await this.usersRepository.save(newUser)
	}

	async getUsers() : Promise<LimitedUserDto[]> {
		return await this._getCompleteUsers()
	}

	async getUserById(id: string) : Promise<UserDto> {
		return (await this._getCompleteUsers())
			.find(user => user.id === id)
	}

	async getUserByLogin(login: string) : Promise<UserDto> {
		return (await this._getCompleteUsers())
			.find(user => user.login === login)
	}

	async getUserByName(name: string) : Promise<UserDto> {
		return (await this._getCompleteUsers())
			.find(user => user.name === name)
	}

	async updateUserById(updatedUser: UserDto) : Promise<UserDto> {
		if (!updatedUser)
			throw new ForbiddenException(`no user to update`)
		
		// get the UserDto to update
		let user : UserDto = await this.getUserById(updatedUser.id)
		
		if (!user)
			throw new ForbiddenException(`user ${updatedUser.id} not found`)
		
		if (user === updatedUser)
			throw new ForbiddenException(`nothing to update`)


		// this enable to update only some fields on the request
		user = {
			...user,
			...updatedUser
		}
		
		// check if the (maybe updated) username is unique
		await this._checkNewUserName(user.name)

		return await this.usersRepository.save(user)
	}


	async deleteUserById(id: string) {
		await this.usersRepository.delete({id: id})
	}

	
	/////////////////////
	/* PRIVATE METHODS */
	/////////////////////

	private async _getCompleteUsers() : Promise<UserDto[]> {
		return await this.usersRepository.find()
	}

	/*
	** username format must be like this:
	** - 6 to 16 characters
	** - only letters (lower or upper case)
	*/
	private _checkUserNameFormat(username : string) : boolean {
		return /^[a-zA-Z]{6,16}$/.test(username)
	}

	/*
	** check if the username is unique in the database
	** must be private for security reasons
	*/
	private async _isUniqueUserName(username : string) : Promise<boolean> {
		return (await this.getUserByName(username)) === undefined
	}

	private async _checkNewUserName(username : string) : Promise<boolean> {
		
		// check username format
		if (!this._checkUserNameFormat(username))
		{
			throw new ForbiddenException(`username ${username} is not valid`)
		}

		// check if the username is unique
		if (!(await this._isUniqueUserName(username)))
		{
			throw new ForbiddenException(`username ${username} is already taken`)
		}
		
		return true
	}
}