//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract PetDatabase {
  uint256 public petCount;

  struct Pet {
      string name;
      uint8 age;
      string breed;
      bool isAvailable;
  }
  mapping(uint256 => Pet) public pets;

  event PetAdded(
      uint256 indexed petId,
      string name,
      uint8 age,
      string breed,
      bool isAvailable
  );
  // The following function adds a pet to to the blockchain of pets
  function addPet(
      string memory _name,
      uint8 _age,
      string memory _breed
  ) external {
      petCount++;
      pets[petCount] = Pet(_name, _age, _breed, true);
      emit PetAdded(petCount, _name, _age, _breed, true);
  }
  // The following function returns a single pet given a specific petId
  function getPet(
      uint256 _petId
  ) external view returns (string memory, uint8, string memory, bool) {
      Pet memory pet = pets[_petId];
      return (pet.name, pet.age, pet.breed, pet.isAvailable);
  }
  // The following function returns all pets stored in the blockchain
  function getAllPets() external view returns (Pet[] memory) {
    Pet[] memory allPets = new Pet[](petCount);
    
    for (uint256 i = 1; i <= petCount; i++) {
        allPets[i - 1] = pets[i];
    }
    
    return allPets;
  }

  // The following function updates when a pet is either bought or sold

  function updatePetAvailability(uint256 _petId, bool _isAvailable) external {
      require(_petId <= petCount, "Invalid pet ID");
      pets[_petId].isAvailable = _isAvailable;
  }
}
