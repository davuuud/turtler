import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'

type Turtle = {id: number, name: string} | null

function ControlPanel() {
  return (
    <div className="ControlPanel">
      <button>Turn left</button>
      <button>Left</button>
      <button>Up</button>
      <button>Down</button>
      <button>Right</button>
      <button>Turn right</button>
    </div>
  )
}

function Display() {
  return <canvas id="canvas"></canvas>
}

function Searchbar() {
  return (
    <div className="Searchbar">
      <input type="text" />
    </div>
  )
}

function TurtleEntry(props: any) {
  if (props.isSelected) {
    return <div className="TurtleEntry selected">{props.turtle.name}</div>
  } else {
    return <div className="TurtleEntry">{props.turtle.name}</div>
  }
}

function TurtleSelector(props: any) {
  const list = [...props.turtles].map(
    t => <TurtleEntry key={t.id} turtle={t} isSelected={t === props.curr} />
  )

  return (
    <aside>
      <Searchbar />
      {list}
    </aside>
    
  )
}

function App() {
  const [turtles, setTurtles] = useState<Set<Turtle>>(new Set([]))
  const [curr, setCurr] = useState<Turtle>(null)

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")

    socket.onopen = event => {
      console.log("Connection established")
      socket.send(JSON.stringify({type: "get", value: "turtles"}))
    }
    
    socket.onmessage = event => {
      try {
        const parsedMsg = JSON.parse(event.data)
        console.log(parsedMsg)
        switch (parsedMsg.type) {
          // Full turtle list download
          case "full":
            if (parsedMsg.turtles.length > 0) {
              let newTurtles: Set<Turtle> = new Set(parsedMsg.turtles)
              setTurtles(newTurtles)
              if (!newTurtles.has(curr)) setCurr([...newTurtles][0])
            } else {
              setTurtles(new Set([]))
              setCurr(null)
            }
            break

          case "hi":
            setTurtles((prevState: Set<Turtle>) => new Set(prevState).add(parsedMsg.turtle))
            break

          case "bye":
            console.log("here")
            setTurtles((prevState: Set<Turtle>) => {
              let nextState = new Set(prevState)
              nextState.delete(parsedMsg.turtle)
              return nextState
            })
            if (parsedMsg.turtle === curr) setCurr(null)
            break
        }
      } catch {}
    }

    return () => socket.close()
  }, []);

  return (
    <div className="App">
      <header>
        Icon
        <nav>Nav</nav>
      </header>
      <TurtleSelector turtles={turtles} curr={curr} />
      <main>
        <Display />
        <ControlPanel />
      </main>
    </div>
  )
}

export default App
