local ip = localhost
local port = 8080

local actions = {
    turnLeft = turtle.turnLeft,
    turnRight = turtle.turnRight
}

local function parseMsg(msg)
    local tab,err = textutils.unserialiseJSON(msg)
    if tab then
        if tab.type == "message" then
            print(tab.value)
        elseif tab.type == "eval" then
            local f = loadstring(tab.value)
            if f then
                print("Command: " .. tab.value)
                f()
            else
                print("Error executing command: " .. tab.value)
            end
        end
    else
        print(err)
    end
end

local ws,err = http.websocket("ws://".. ip .. ":" .. port .. "/turtle")

if ws then
    parallel.waitForAny(
        function() os.pullEvent("key") end,
        function()
            while true do
                local ans = ws.receive()
                if ans then
                    parseMsg(ans)
                else
                    break
                end
            end
        end
    )
    ws.close()
else
    print(err)
end