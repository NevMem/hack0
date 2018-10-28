
import requests
import json

def offset_print(s, offset):
    print()
    for i in s.split('\n'):
        print('\t' * offset, i.strip())
    print()


bot_url = "https://api.telegram.org/bot"
api_url = "http://172.31.19.207/"

def get_updates_json(request, params = dict()):
    response = requests.get(request + 'getUpdates', params)
    return response.json()


def last_update(data):
    results = data['result']
    total_updates = len(results) - 1
    if (total_updates == -1): return {'update_id':0}
    return results[total_updates]

def get_chat_id(update):
    chat_id = update['message']['chat']['id']
    return chat_id

def send_mess(chat, text, add_args = dict()):
    offset_print("Message to " + str(chat) + "\n------\n" + text, 1)
    params = {'chat_id': chat, 'text': text, 'parse_mode' : 'html'}
    for i in add_args.keys():
        params[i] = add_args[i]
    response = requests.post(bot_url + 'sendMessage', data=params)
    print(response, params)
    return response

def get_command(text):
    arr = text.split()
    return {'command' : arr[0], 'args' : " ".join(arr[1:])}

def auth(data):
    url = api_url + "login"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    return response

def initiate_room(data):
    url = api_url + "initiate_room"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    return response

def join(data):
    url = api_url + "join"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    return response

def leave(data):
    url = api_url + "leave"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    return response

def myposition(data):
    url = api_url + "myposition"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    return response


def getname(data):
    url = api_url + "getname"
    offset_print("Request to " + url + "\n" + str(data), 2)
    response = requests.post(url, data=data).json()
    print(requests.post(url, data=data))
    return response

def main():
    custom_keyboard = json.dumps({"keyboard":[["Position","Leave"]],"one_time_keyboard":True})

    global bot_url
    with open('bot_info.json', 'r') as f:
        data = json.load(f)
        bot_url += data["telegram_token"] + "/"
    print(bot_url)


    response = ((auth({'login' : 'admin', 'password' : 'admin'})))
    print(response)

    tokensdb = dict() # To be replaced with database requests
    pindb = dict() # To be replaced with database requests
    
    update_id = last_update(get_updates_json(bot_url))['update_id']
    while True:
        update = (get_updates_json(bot_url, {'offset' : update_id}))
        if (len(update) == 0): continue
        update = last_update(update);
        # print (update_id)
        if (update['update_id'] != update_id):
            uid = get_chat_id(update)
            update_id = update['update_id']
            command = get_command(update['message']['text'])
            print('----', command['command'])
            if (command['command'] == '/join'):
                message_text = ""
                try:
                    response = join({'pin' : command['args']})
                    if ('token' in response.keys() and (uid not in pindb.keys() or pindb[uid] != command['args'])):
                        message_text = "Successfully joined room #" + command['args'] + ' (<b>' + getname({'pin' : command['args']})['name'] + '</b>)' #\nToken:' + response['token']
                        tokensdb[uid] = response['token']
                        pindb[uid] = command['args']
                    else:
                        message_text = "Failed! an error occured\n" + response['err']
                except Exception as e:
                    message_text = "Failed! an error occured\n" + str(e)
                send_mess(uid, message_text, {'reply_markup' : custom_keyboard})
            elif (command['command'] == 'Position'):
                message_text = ""
                if (uid not in tokensdb.keys()):
                    message_text = "You have not joined any room yet"
                else:
                    try:
                        response = myposition({'token' : tokensdb[uid], 'pin' : pindb[uid]})
                        if ('position' in response.keys()):
                            people_left = (response['position'] - 1)
                            message_text = "There are " + str(max(0, people_left)) + " people before you\n"
                            if (people_left == 0):
                                message_text += "It's your turn"
                            elif (people_left == 1):
                                message_text += "You are the next"
                            else:
                                message_text = "[<b>" + str(response['serving']) + "</b>] --- Current user\n";
                                message_text += " " + str(response['next']) + "\n"
                                if (people_left > 2):
                                    message_text += ".\n(" + str(people_left - 2) + ") more people\n.\n"
                                message_text += " <b>" + str(response['qid']) + "</b> --- You"
                        else:
                            message_text = "Failed! an error occured\n" + response['err']
                    except Exception as e:
                        message_text = "Failed! an error occured\n" + str(e)
                send_mess(uid, message_text, {'reply_markup' : custom_keyboard})
            elif (command['command'] == 'Leave'):
                message_text = ""
                if (uid in tokensdb.keys()):
                    try:
                        response = leave({'pin' : pindb[uid], 'token' : tokensdb[uid]})
                        if ('err' not in response.keys()):
                            message_text = "Successfully left room #" + pindb[uid] + ' (<b>' + getname({'pin' : pindb[uid]})['name'] + '</b>)'
                            pindb.pop(uid)
                        else:
                            message_text = "Failed! an error occured\n" + response['err']
                    except Exception as e:
                        message_text = "Failed! an error occured\n" + str(e)
                else:
                    message_text = "You have not joined any room yet"
                if (uid in pindb.keys()):
                    send_mess(uid, message_text, {'reply_markup' : custom_keyboard})
                else:
                    send_mess(uid, message_text)
            # elif (command['command'] == '/authorize'):
            #     args = command['args'].strip().split()
            #     message_text = ""
            #     if (len(args) != 2) :
            #         message_text = "Failed, please provide login and password i.e. /authorize login password"
            #     else:
            #         try:
            #             response = auth({'login' : args[0], 'password' : args[-1]})
            #             if ('token' in response.keys()):
            #                 tokensdb[uid] = response['token']
            #             else:
            #                 message_text = "Failed! an error occured\n" + response['err']
            #         except Exception as e:
            #             message_text = "Failed! an error occured\n" + str(e)
            #     send_mess(uid, message_text)
            # elif (command['command'] == '/newroom'):
            #     message_text = ""
            #     if (uid not in tokensdb.keys()):
            #         message_text = "You have not joined any room or authorized yet"
            #     else:
            #         try:
            #             response = initiate_room(tokensdb[uid])
            #             if ('pin' in response.keys()):
            #                 pindb[tokensdb[uid]] = response['pin']
            #                 message_text = "You have successfully created room #" + str(response['pin'])
            #             else:
            #                 message_text = "Failed! an error occured\n" + response['err']
            #         except Exception as e:
            #             message_text = "Failed! an error occured\n" + str(e)
            #     if ("successfully" in message_text):
            #         send_mess(message_text)





if __name__ == '__main__':
    main()