import requests


def download(url: str, filepath: str):
    """
    Simple download method which calls the given URL and saves the file at the given filepath.
    :param url: URL to download from
    :param filepath: Filepath to save to
    :return: Whether the download was successful or not
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(response.content)
        print("File downloaded successfully.")
    except Exception as e:
        print(f"Error downloading file: {e}")
        raise
