import {useState} from "react"
import "./App.css"
import background_image from "./images/homepage-logo.png"
import Game from "./components/Game"
import io from "socket.io-client"
import initReactFastclick from "react-fastclick"
initReactFastclick();
const {uniqueNamesGenerator, adjectives, animals} = require("unique-names-generator")
const filter = require("leo-profanity")

const socket = io.connect("http://stupid-superpowers.herokuapp.com")

function App() {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [color, setColor] = useState("")
  const [visibility, setVisibility] = useState("")
  const [logged, setLogged] = useState(false)

  const checkName = newColor => {
    let newName = name
    newName = newName.trim()
    if ((newColor === "green" && filter.check(newName)) || newName === "") {
      newName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: "",
        style: "capital"
      })
    }
    setName(newName)
  }

  const joinRandomGame = color => {
    socket.emit("joinRandomGame", color)
    socket.on("joinedRandomGame", newCode => {
      setCode(newCode)
      setColor(color)
      setVisibility("public")
      checkName(color)
      setLogged(true)
    })
  }

  const joinExistingGame = () => {
    socket.emit("joinExistingGame", code)
    socket.on("joinedExistingGame", data => {
      if (data.res === -1) {
        alert("Game Doesn't Exist")
      } else if (data.res === -2) {
        alert("Game Is In Progress")
      } else {
        setCode(code)
        setColor(data.color)
        setVisibility(data.visibility)
        checkName(data.color)
        setLogged(true)
      }
    })
  }

  const createPrivateGame = color => {
    socket.emit("createPrivateGame", color)
    socket.on("createdPrivateGame", newCode => {
      setCode(newCode)
      setColor(color)
      setVisibility("private")
      checkName(color)
      setLogged(true)
    })
  }

  return (
      <div>
        {!logged ? (
            <div className={"Homepage"}>
              <div className={"Header"}>
                <img className={"Logo"} src={background_image} alt={"Homepage Logo"}/>

                <br/>

                <h1 className={"Title"}>Stupid</h1>
                <h1 className={"Title"}>Superpowers</h1>
              </div>
              <div className={"JoinGame"}>
                <input
                    className={"HomepageInput"}
                    placeholder="Enter Username"
                    onChange={(event) => {setName(event.target.value)}}
                />

                <br/>

                <button className={"GreenBox HomepageButton"} onClick={() => joinRandomGame("green")}>Join Random Green Game</button>
                <button className={"YellowBox HomepageButton"} onClick={() => joinRandomGame("yellow")}>Join Random Yellow Game</button>

                <br/>

                <input
                    className={"HomepageInput"}
                    placeholder="Enter Game Code"
                    onChange={(event) => {setCode(event.target.value)}}
                />
                <button className={"Join HomepageButton"} onClick={joinExistingGame}>Join Game</button>

                <br/>

                <button className={"GreenBox HomepageButton"} onClick={() => createPrivateGame("green")}>Create Private Green Game</button>
                <button className={"YellowBox HomepageButton"} onClick={() => createPrivateGame("yellow")}>Create Private Yellow Game</button>
              </div>
            </div>
        ) : (
            <Game socket={socket} name={name} code={code} color={color} visibility={visibility}/>
        )}
      </div>
  )
}

export default App;
