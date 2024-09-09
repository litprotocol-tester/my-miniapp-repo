# Creating a Mini App with Lit
This code example demonstrates how to implement custom authentication and authorization using Telegram OAuth. The end result is a PKP that can only be used to sign data if you have a valid and recent Telegram OAuth Data for a specific user. 

This implementation is based on the [custom-auth-telegram-example](https://github.com/LIT-Protocol/custom-auth-telegram-example), but the logic has been changed to work for a Telegram Mini App. We will be deploying the code example on Vercel, but this can be changed depending on your implementation, but your Telegram Mini App will need an HTTPS endpoint.

## How it Works
1. The user opens the Telegram Mini App. Through opening the Mini App window, we are able to get the `initData` from the Telegram window.
2. We verify the `initData` to ensure it is valid and recent. We do this by using the `isRecent` and `verifyInitData` functions from the [TelegramAuthHelpers.ts]('src/telegramAuthHelpers.ts') file.
3. The user connects their MetaMask wallet to the Mini App by clicking the "Connect to MetaMask" button.
4. The user clicks the "Mint PKP" button to mint a new PKP and add the custom Telegram authorization to it.
5. The user clicks the "Get Session Signatures" button to get the session signatures for the PKP.

## How to Run the Example

#### Creating a Telegram Bot
To run this example, we will first need to create a Telegram Mini App. To start, we'll need to make a new Telegram bot.
1. Go to the [BotFather](https://t.me/BotFather).
2. Use the `/newbot` command to create a new bot. Give the bot a name and a username.
3. At this point you will be given a Bot Secret Token. We will need this later

#### Clone the Repository
The next step is to clone this repository, and push the code to a new Github repo that your account owns. This is a requirement because we need to give Vercel access to the repo in order to host it.

Start by [creating a new Github repo](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) using your account. The name of your repo is not important for running this code example.

Next, clone this repo using:

```
git clone https://github.com/LIT-Protocol/telegram-miniapp-example.git
```

`cd` into the repo directory:

```
cd telegram-miniapp-example
```

Then remove the `origin` remote Git URL:

```
git remote remove origin
```

Then add the remote Git URL for your new Github repo:

```
git remote add origin https://github.com/<your-github-username>/<your-repo-name>.git
```

Then push the cloned code to your Github repo:

```
git push -u origin main
```

### Step 3: Setup Vercel

Create a free Vercel account [here](https://vercel.com/signup), if you don't already have one.

Follow [this guide](https://vercel.com/docs/deployments/git#deploying-a-git-repository) on connecting your Github repo to Vercel for deployment.

As part of setting up your project on Vercel, you'll need to set an ENV in order for this code example to work. You can follow [this guide](https://vercel.com/docs/projects/environment-variables) on how to add ENVs. The ENV you'll need to set is:

1. `VITE_TELEGRAM_BOT_SECRET` This is the secret bot token generated for you after naming your bot.
   - **NOTE** This secret token is exposed to anyone who visits your site. You'll want to refactor the code in this example that handles `VITE_TELEGRAM_BOT_SECRET` to be ran on a server that unauthorized users don't have access to. This code example was written this way for simplicity, but **it is NOT SECURE**.

After setting the ENV and deploying the Vercel project, you should be generated a URL by Vercel where you can access the web app. This will look something like:

```
https://NAME_OF_YOUR_GITHUB_REPO.vercel.app/
```

You should visit this URL in your browser and see the web app. Please keep in mind that the example will not work unless opened in a Telegram Mini App.

### Step 4: Set the Menu Button for the Bot

Now that you have a working Telegram Mini App, you'll need to set the menu button for the bot. This can be done by:

1. Go to the [@BotFather](https://t.me/BotFather) and run the `/mybots` command.
2. Click the bot you created in the previous step.
3. Go to "Bot Settings" and click "Menu Button".
4. Click "Configure menu button", send the Vercel URL generated previously and give a title to the menu button.
5. You'll also want to give the bot a domain. This is done using the `/setdomain` command. You'll be prompted to enter the username of the bot to set the domain for, enter the name you gave your bot that ends with `_bot` or `Bot`, prefixed with the `@` symbol e.g. `@Example_bot`.
6. nter the URL generated for your project by Vercel, after you receive the success message, you'll be all good to go!

Now enter the URL generated for your project by Vercel, after you receive the success message, you'll be all good to go!

### Step 4: Run the Example

Now you can go back to the web app using the Vercel generated URL and run the code example. If you see the error `Bot domain invalid`, that means the URL you're accessing does not match the URL you gave [@BotFather](https://t.me/botfather) when running the `/setdomain` command.

In order to successfully run the example, the Ethereum account that you connect to the web app using your browser wallet extension needs to have Lit test tokens. If you don't already have some, you can request some using [the faucet](https://chronicle-yellowstone-faucet.getlit.dev/).
