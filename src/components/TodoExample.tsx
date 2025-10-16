import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface Todo {
  id: string;
  title: string;
}

function TodoExample() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    async function getTodos() {
      const { data: todos, error } = await supabase.from('todos').select()

      if (error) {
        console.error('Error fetching todos:', error)
        return
      }

      if (todos && todos.length > 0) {
        setTodos(todos as Todo[])
      }
    }

    getTodos()
  }, [])

  return (
    <div>
      <h2>Todos</h2>
      {todos.length > 0 ? (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      ) : (
        <p>No todos found</p>
      )}
    </div>
  )
}

export default TodoExample