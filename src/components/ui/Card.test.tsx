import React from 'react'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('子要素を含むカードを表示する', () => {
    render(
      <Card>
        <h2>カードタイトル</h2>
        <p>カードの内容です。</p>
      </Card>
    )
    
    expect(screen.getByText('カードタイトル')).toBeInTheDocument()
    expect(screen.getByText('カードの内容です。')).toBeInTheDocument()
  })

  it('デフォルトのスタイルクラスが適用される', () => {
    render(
      <Card data-testid="card">
        <p>テスト内容</p>
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-6')
  })

  it('カスタムクラス名が適用される', () => {
    render(
      <Card className="custom-class" data-testid="card">
        <p>カスタムクラステスト</p>
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-6')
  })

  it('レスポンシブデザインクラスが適用される', () => {
    render(
      <Card data-testid="card">
        <p>レスポンシブテスト</p>
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('w-full')
  })

  it('適切なHTML構造で表示される', () => {
    render(
      <Card data-testid="card">
        <div>
          <h3>テストタイトル</h3>
          <button>テストボタン</button>
        </div>
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card.tagName).toBe('DIV')
    
    const title = screen.getByText('テストタイトル')
    const button = screen.getByRole('button', { name: 'テストボタン' })
    
    expect(title).toBeInTheDocument()
    expect(button).toBeInTheDocument()
  })

  it('空の子要素でも表示される', () => {
    render(
      <Card data-testid="card">
        {null}
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-6')
  })

  it('複数の子要素を正しく表示する', () => {
    render(
      <Card>
        <h1>メインタイトル</h1>
        <h2>サブタイトル</h2>
        <p>段落1</p>
        <p>段落2</p>
        <button>アクションボタン</button>
      </Card>
    )
    
    expect(screen.getByText('メインタイトル')).toBeInTheDocument()
    expect(screen.getByText('サブタイトル')).toBeInTheDocument()
    expect(screen.getByText('段落1')).toBeInTheDocument()
    expect(screen.getByText('段落2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アクションボタン' })).toBeInTheDocument()
  })

  it('文字列も子要素として受け入れる', () => {
    render(<Card>シンプルなテキスト</Card>)
    
    expect(screen.getByText('シンプルなテキスト')).toBeInTheDocument()
  })
})