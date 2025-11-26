import json

class Preferences:
    @staticmethod
    def _get_preferences_path() -> str:
        '''
        Get preferences file path from settings file.
        '''
        return r"C:\Users\tyler\OneDrive\Desktop\Green Maple Leaf App\preferences.json" # Will be replaced.

    @staticmethod
    def get_preferences_data() -> object:
        '''
        Returns the current preferences data.
        '''
        with open(Preferences._get_preferences_path(), 'r') as config_file:
            raw_data: str = config_file.read()
            return json.loads(raw_data)

    @staticmethod
    def save_preferences(new_preferences: object) -> bool:
        '''
        Save new preference data to preferences file.
        '''
        print("Trying to save!")
        try:
            # Write updated preferences back to file
            print("Saving preferences:", new_preferences)
            with open(Preferences._get_preferences_path(), 'w') as config_file:
                config_file.write(json.dumps(new_preferences, indent=4))

        except Exception as e:
            print(f"Error saving preferences: {e}")
            return False
        else:
            return True
        