import requests
import json


keyboard = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
         ['0']
];


url = "https://api.telegram.org/bot704258494:AAFtU8BuZ2AaXhzvp79WqUCDJxS22HwDYHg/"


def get_updates_json(request):
    response = requests.get(request + 'getUpdates')
    return response.json()


def last_update(data):
    results = data['result']
    total_updates = len(results) - 1
    return results[total_updates]

def get_chat_id(update):
    chat_id = update['message']['chat']['id']
    print(update['message']['date'])
    print(chat_id)
    return chat_id

def send_mess(chat, text, add_args = dict()):
    print(text)
    params = {'chat_id': chat, 'text': text}
    for i in add_args.keys():
        params[i] = add_args[i]
    response = requests.post(url + 'sendMessage', data=params)
    return response

def get_command(text):
    arr = text.split()
    return {'command' : arr[0], 'args' : " ".join(arr[1:])}

def main():
    update_id = last_update(get_updates_json(url))['update_id']
    while True:
        update = last_update(get_updates_json(url))
        if (update['update_id'] != update_id):
            update_id = update['update_id']
            command = get_command(update['message']['text'])
            print(command['command'])
            if (command['command'] == '/join'):
                # Request to join room, exception catching
                send_mess(get_chat_id(update), 'You successfully joined room #' + command['args'], {'reply_markup' : '{"keyboard":[["Position"]]}'})
            elif (command['command'] == 'Position'):
                # Request to find your position
                send_mess(get_chat_id(update), 'You are waiting :)', {'reply_markup' : '{"keyboard":[["Position"]]}'})

if __name__ == '__main__':
    main()