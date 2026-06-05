import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Expense {
  id: string
  group_id: string
  title: string
  amount: number
  paid_by: string
  created_at: string
}

export function useGroupExpenses(groupId: string, userId: string, memberCount: number) {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (!groupId) return
    load()
  }, [groupId])

  const load = async () => {
    const { data } = await supabase
      .from('group_expenses').select('*')
      .eq('group_id', groupId).order('created_at', { ascending: false })
    setExpenses(data ?? [])
  }

  const addExpense = async (title: string, amount: number) => {
    const { error } = await supabase.from('group_expenses')
      .insert({ group_id: groupId, title, amount, paid_by: userId })
    if (error) throw error
    await load()
  }

  const deleteExpense = async (id: string) => {
    await supabase.from('group_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const myPaid = expenses.filter(e => e.paid_by === userId).reduce((s, e) => s + Number(e.amount), 0)
  const mc = Math.max(memberCount, 1)
  const perPerson = total / mc
  const myBalance = myPaid - perPerson  // positive = others owe me, negative = I owe

  return { expenses, addExpense, deleteExpense, total, myPaid, perPerson, myBalance }
}
