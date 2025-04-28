![GitHub License](https://img.shields.io/github/license/Unarekin/FoundryVTT-Stage-Manager)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Unarekin/FoundryVTT-Stage-Manager)
![Foundry Version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Fstyle%3Dflat%26url%3Dhttps%3A%2F%2Fgithub.com%2FUnarekin%2FFoundryVTT-Stage-Manager%2Freleases%2Flatest%2Fdownload%2Fmodule.json)
![System version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fsystem%3FnameType%3Dfull%26showVersion%3D1%26style%3Dflat%26url%3Dhttps%3A%2F%2Fimg.shields.io%2Fendpoint%3Furl%3Dhttps%253A%252F%252Ffoundryshields.com%252Fversion%253Fstyle%253Dflat%2526url%253Dhttps%253A%252F%252Fgithub.com%252FUnarekin%252FFoundryVTT-Stage-Manager%252Freleases%252Flatest%252Fdownload%252Fmodule.json)

![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/Unarekin/FoundryVTT-Stage-Manager/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fstage-manager&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=stage-manager)

![StageManager](https://github.com/user-attachments/assets/a98878af-0e86-401c-89ef-0f74539217dc)


- [Stage Manager](#stage-manager)
  - [At a Glance](#at-a-glance)
  - [Installation](#installation)
  - [Usage Instructions](#usage-instructions)
- [Compability With Other Systems and Modules](#compability-with-other-systems-and-modules)
- [Extensions](#extensions)
- [Attributions \& Acknowledgements](#attributions--acknowledgements)
- [Support](#support)




# Stage Manager
Stage Manager grew out of a desire for a more flexible, automatable method for having visual novel style dialogue than is feasible with existing modules.  The module has grown beyond that initial vision, and now provides tools to create all sorts of visuals on the screen.  These could be a visual novel dialogue, they could be a video game-like HUD for your PCs, it could be a cutscene that plays when you trigger it.

It gives you a downright unprecedented amount of control over the visual style of your game.

## At a Glance
- Place a number of types of objects on the screen and have them stay in place as you pan and zoom the game canvas.
  - Images, text, progress bars and clocks, and a few others
- Add shader effects to these objects to further customize their appearance, ranging from a simple outline to an animated hologram-like effect
- Trigger an action, such as executing a macro, when certain events happen, like clicking on a stage object, an Actor being changed, or where supported an item being used.
- Progress bars and clocks that automatically update based on values from another object -- such as an Actor's HP or MP.

## Installation
To install this module, copoy and paste the following manifest URL to the module installation window in Foundry:
```
https://github.com/Unarekin/FoundryVTT-Stage-Manager/releases/latest/download/module.json
```

## Usage Instructions
Please see the [wiki](https://github.com/Unarekin/FoundryVTT-Stage-Manager/wiki).


# Compability With Other Systems and Modules
- [Project FU](https://github.com/League-of-Fabulous-Developers/FoundryVTT-Fabula-Ultima) - The `itemRoll` trigger event is supported for Project FU.
- [Battle Transitions](https://foundryvtt.com/packages/battle-transitions) - If Battle Transitions is detected when Stage Manager initializes, it will move the former's PIXI layer between its own foreground and primary layers.  Further configurability options are planned for the future.

# Extensions
- [Stage Manager - GUI](https://github.com/Unarekin/FoundryVTT-Stage-Manager-GUI) Adds features more specifically intended for video game-like GUI creation, such as automated progress bars based on actor resources, etc.
- [Stage Manager - VN](https://github.com/Unarekin/FoundryVTT-Stage-Manager-VN) Adds features intended for more Visual Novel like dialogues

# Attributions & Acknowledgements
- The `select-background.svg`, `select-foreground.svg`, and `select-primary.svg` icons are edited versions of [Fontawesome](https://fontawesome.com) icons.  The original icons and these edited versions are both released under the [CC-By-4.0](https://creativecommons.org/licenses/by/4.0/deed.en) license.
- The `actor-sheet.svg` ([original](https://game-icons.net/1x1/delapouite/skills.html)) and `theater-curtains.svg` ([original](https://game-icons.net/1x1/delapouite/theater-curtains.html)) are both by [Delapouite](https://delapouite.com/) on [Game-Icons.net](https://game-icons.net) and are released under the [CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/) license.
- The clock images provided in this module are edited versions of the ones originally released by Justin Alexander on his blog, [The Alexandrian](https://thealexandrian.net/wordpress/40424/roleplaying-games/blades-in-the-dark-progress-clocks).  The original images were released under no specific license, permission is explicitly granted for all commercial and non-commercial use, with attribution.

# Support
If you're feeling generous, please feel free to make a donation at my [Ko-Fi](https://ko-fi.com/unarekin) page, it's much appreciated!
