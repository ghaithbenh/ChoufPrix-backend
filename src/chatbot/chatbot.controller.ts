import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ChatbotService } from './chatbot.service.js';

class ChatbotRequestDto {
  message: string;
  city?: string;
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  handleMessage(@Body() body: ChatbotRequestDto) {
    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      throw new BadRequestException('Message must be provided as a non-empty string.');
    }

    return this.chatbotService.processMessage(body.message, body.city);
  }
}
