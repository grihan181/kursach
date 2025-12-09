import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sender!: string;

  @Column('text')
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @RelationId((message: Message) => message.conversation)
  conversationId!: string;
}
