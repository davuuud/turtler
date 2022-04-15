import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'

type Turtle = {id: number, name: string}
const EMPTY_TURTLE: Turtle = {id: 0, name: ""}

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
  const handleSelect = () => {
    props.onSelect(props.turtle)
  }

  if (props.isSelected) {
    return <div className="TurtleEntry selected">{props.turtle.name}</div>
  } else {
    return <div className="TurtleEntry" onClick={handleSelect}>{props.turtle.name}</div>
  }
}

function TurtleSelector(props: any) {
  const list = props.turtles.map(
    (t: Turtle) => <TurtleEntry
                    key={t.id}
                    turtle={t}
                    isSelected={t === props.curr}
                    onSelect={props.onSelect} />
  )

  return (
    <aside>
      <Searchbar />
      {list}
    </aside>
    
  )
}

function App() {
  const [turtles, setTurtles] = useState<Turtle[]>([])
  const [curr, setCurr] = useState<Turtle>(EMPTY_TURTLE)

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")

    socket.onopen = event => {
      console.log("Connection established")
      socket.send(JSON.stringify({type: "get", value: "turtles"}))
    }
    
    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data)
        // console.log(msg)
        switch (msg.type) {
          case "full":
            if (msg.turtles.length > 0) {
              setTurtles(msg.turtles)
              setCurr(msg.turtles.find((t: Turtle) => t.id === curr.id) || EMPTY_TURTLE)
            } else {
              setTurtles([])
              setCurr(EMPTY_TURTLE)
            }
            break

          case "hi":
            setTurtles(prevState => 
              [...prevState.filter(t => t.id !== msg.turtle.id), msg.turtle].sort((a, b) => a.id - b.id)
            )
            break

          case "bye":
            setTurtles(prevState => prevState.filter(t => t.id !== msg.turtle.id))
            if (msg.turtle.id === curr.id) setCurr(EMPTY_TURTLE)
            break
        }
      } catch {}
    }

    return () => socket.close()
  }, []);

  const currSelect = (turtle: Turtle) => {
    setCurr(turtle);
  }

  return (
    <div className="App">
      <header>
        Icon
        <nav>Nav</nav>
      </header>
      <TurtleSelector
        turtles={turtles}
        curr={curr}
        onSelect={currSelect} />
      <main>
        <Display />
        <ControlPanel />
      </main>
    </div>
  )
}

export default App
