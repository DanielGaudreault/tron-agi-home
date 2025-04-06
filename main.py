# main.py

from grid.environment import TronGrid
from agi.brain import AGIBrain
from agi.communication import ConsoleInterface

def main():
    # Initialize environment
    grid = TronGrid(width=10, height=10)

    # Initialize AGI agent
    agi = AGIBrain(name="TRONA", grid=grid)

    # Communication layer
    interface = ConsoleInterface(agi)

    # Run the main loop
    while True:
        grid.render()
        command = input("You > ")
        response = interface.process_input(command)
        print(f"TRONA > {response}")
        agi.update()

if __name__ == "__main__":
    main()
