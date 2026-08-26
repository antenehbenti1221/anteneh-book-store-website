# Free Video Studio

Personal creator tool for script/image -> video generation.

## Architecture

Browser UI -> secure server endpoint -> Kaggle API -> Kaggle GPU notebook -> MP4.

Keep `KAGGLE_API_TOKEN` only in the server environment. Never put it in browser JavaScript, GitHub source, or chat.

Kaggle free GPU compute is quota-limited. This project targets $0 software/services and maximum use of free compute; it does not promise unlimited GPU time.
