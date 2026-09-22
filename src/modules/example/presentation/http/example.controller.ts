import { Body, Controller, Post } from '@nestjs/common';
import { CreateExampleDto } from '../../application/dto/create-example.dto';
import { CreateExampleService } from '../../application/services/create-example.service';
import { ExampleResponseDto } from './dto/example-response.dto';

@Controller('examples')
export class ExampleController {
  constructor(private readonly createExample: CreateExampleService) {}

  @Post()
  async create(@Body() input: CreateExampleDto): Promise<ExampleResponseDto> {
    return ExampleResponseDto.fromDomain(await this.createExample.execute(input));
  }
}
