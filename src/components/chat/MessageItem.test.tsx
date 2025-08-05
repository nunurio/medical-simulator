import React from 'react'
import { render, screen } from '@testing-library/react'
import { MessageItem } from './MessageItem'
import type { ChatMessage, EncounterId } from '@/types/chat'
import { createISODateTime } from '@/types/core'

// テスト用のメッセージデータ
const mockPatientMessage: ChatMessage = {
  id: 'msg-1',
  encounterId: 'enc-1' as EncounterId,
  timestamp: createISODateTime('2024-01-01T10:00:00Z'),
  messageType: 'patient',
  content: '胸が痛みます'
}

const mockSimulatorMessage: ChatMessage = {
  id: 'msg-2',
  encounterId: 'enc-1' as EncounterId,
  timestamp: createISODateTime('2024-01-01T10:01:00Z'),
  messageType: 'simulator',
  content: 'どのような痛みですか？'
}

describe('MessageItem', () => {
  it('患者メッセージを正しく表示する', () => {
    render(<MessageItem message={mockPatientMessage} />)
    
    expect(screen.getByText('胸が痛みます')).toBeInTheDocument()
    expect(screen.getByTestId('message-item')).toHaveClass('patient-message')
  })

  it('医師メッセージを正しく表示する', () => {
    render(<MessageItem message={mockSimulatorMessage} />)
    
    expect(screen.getByText('どのような痛みですか？')).toBeInTheDocument()
    expect(screen.getByTestId('message-item')).toHaveClass('simulator-message')
  })

  it('タイムスタンプが正しく表示される', () => {
    render(<MessageItem message={mockPatientMessage} />)
    
    // ISO日時が適切にフォーマットされて表示される（UTCとローカル時間の差を考慮）
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('メッセージタイプに応じたスタイルが適用される', () => {
    const { rerender } = render(<MessageItem message={mockPatientMessage} />)
    
    expect(screen.getByTestId('message-item')).toHaveClass('patient-message')
    
    rerender(<MessageItem message={mockSimulatorMessage} />)
    expect(screen.getByTestId('message-item')).toHaveClass('simulator-message')
  })
})