import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from '@/hooks/useSession'
import { useMutation, useQuery } from 'convex/react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { DrawerFooter, DrawerHeader, DrawerTitle } from './ui/drawer'

export function Chat () {
  const { sessionId } = useSession()
  const messages = useQuery(api.chat.list)
  const sendMessage = useMutation(api.chat.send)
  const [text, setText] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (text && sessionId) {
      try {
        await sendMessage({ text, sessionId })
        setText('')
      } catch (error: any) {
        toast.error(error.message)
      }
    }
  }

  return (
    <div className='flex flex-col h-full'>
      <DrawerHeader>
        <DrawerTitle>Chat</DrawerTitle>
      </DrawerHeader>
      <div className='flex-1 overflow-y-auto px-4'>
        {messages?.map(message => (
          <div key={message._id} className='mb-2'>
            <strong>{message.user?.username ?? 'Anonymous'}:</strong>{' '}
            {message.text}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <DrawerFooter>
        <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='Type a message...'
          />
          <Button type='submit'>Send</Button>
        </form>
      </DrawerFooter>
    </div>
  )
}
