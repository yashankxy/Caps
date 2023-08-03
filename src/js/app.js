function ShowedPet(id, petName, picture, age, breedName, location) {
  var petsRow = $('#petsRow');
  var petTemplate = $('#petTemplate');
  console.log('show pet');
  petTemplate.find('.panel-title').text(petName);
  petTemplate.find('img').attr('src', picture);
  petTemplate.find('.pet-breed').text(breedName);
  petTemplate.find('.pet-age').text(age);
  petTemplate.find('.pet-location').text(location);
  petTemplate.find('.btn-adopt').attr('data-id', id);
  petTemplate.find('.btn-vote').attr('data-id', id);
  petsRow.append(petTemplate.html());
}
 

function donateEther () {
  console.log('donateEther function called');
  var donationAmount = $('#donationAmount').val();

  // Convert the donation amount to Wei
  var donationAmountWei = web3.toWei(donationAmount, 'ether');
  console.log('Donation Amount:', donationAmount); 
  // Call the donate function in your smart contract, passing the donation amount in Wei
  App.contracts.Adoption.deployed().then(function(instance) {
    console.log('Calling instance.donate with donationAmountWei:', donationAmountWei);
    return instance.donate({ value: donationAmountWei });
  }).then(function(result) {
    // Donation successful
    console.log('Donation successful:', result);
    // Close the dialog
    $('#donateEtherDialog').modal('hide');
  }).catch(function(error) {
    // Error occurred during donation
    console.error('Error occurred during donation:', error);
    // Close the dialog
    $('#donateEtherDialog').modal('hide');
  });
}




function adopt(petId) {
  var petInstance;

  App.contracts.Adoption.deployed().then(function(instance) {
    petInstance = instance;

    return petInstance.adopt(petId, { from: App.account });
  }).then(function(result) {
    // Pet adoption successful
    // Update the adoptionHistory for the user
    if (App.adoptionHistory[App.account]) {
      App.adoptionHistory[App.account].push(petId);
    } else {
      App.adoptionHistory[App.account] = [petId];
    }

    // Update the UI or do any other necessary tasks
  }).catch(function(error) {
    // Error occurred during pet adoption
    console.error('Error occurred during pet adoption:', error);
  });
}

function getUserAdoptionHistory(userAddress) {
  return App.adoptionHistory[userAddress] || [];
}

function populateAdoptionHistoryBox() {
  var userAddress = App.account; // Replace this with the currently logged-in user's address/identifier

  // Get the user's adoption history from the App.adoptionHistory object
  var adoptionHistory = App.adoptionHistory[userAddress] || [];

  // Clear any previous content in the adoption list
  $('#adoptionList').empty();

  // Populate the adoption list with the user's adoption history
  adoptionHistory.forEach(function(petId) {
    // You can customize how the adoption history is displayed (e.g., pet name, picture, etc.)
    var petInfo = App.registeredPets.find(function(pet) {
      return pet.id === petId;
    });

    if (petInfo) {
      var listItem = $('<li>').text(petInfo.name);
      $('#adoptionList').append(listItem);
    }
  });
}
// Add this to your existing App object

// Function to open the adoption history modal
function openAdoptionHistoryModal(adoptionHistory) {
  var modal = $('#adoptionHistoryModal');
  var adoptionList = $('#adoptionList');

  // Clear previous data
  adoptionList.empty();

  // Populate the modal with adoption history data
  adoptionHistory.forEach(function(petId) {
    var petInfo = App.registeredPets.find(function(pet) {
      return pet.id === petId;
    });

    if (petInfo) {
      var listItem = $('<li>').text(petInfo.name);
      adoptionList.append(listItem);
    }
  });

  // Show the modal
  modal.css('display', 'block');

  // Close the modal when the close button is clicked
  modal.find('.close').click(function() {
    modal.css('display', 'none');
  });

  // Close the modal if the user clicks outside of it
  $(window).click(function(event) {
    if (event.target === modal[0]) {
      modal.css('display', 'none');
    }
  });
}

// Add an event handler for the search button
$('#searchButton').click(function() {
  var userAccount = $('#userAccountInput').val();

  // Retrieve the adoption history for the user
  var adoptionHistory = getUserAdoptionHistory(userAccount);

  // Display the adoption history in a modal
  openAdoptionHistoryModal(adoptionHistory);
});


App = {
  web3Provider: null,
  contracts: {},
  registeredPets: [],
  adoptionHistory: {},

  
  init: async function() {
    console.log('Initializing App...');
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      console.log('Received pets data:', data);
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });
    $(document).on('click', '.btn-delete', App.deletePet);

    return await App.initWeb3();
  },

  registerPet: function() {
    console.log('Registering a new pet...');
    var adoptionInstance;
    var petPhotoInput = $('#petPhoto')[0]; // Get the file input element
    var petPhoto = petPhotoInput.files[0]; // Get the selected file
  
    // Fetch the user account
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log('Web3 error ');
        return;
      }
      var account = accounts[0];
  
      var petName = $('#petName').val();
      var petAge = $('#petAge').val();
      var petBreed = $('#petBreed').val();
      var petLocation = $('#petLocation').val();
  
      // Create a new FormData object
      var formData = new FormData();
      formData.append('name', petName);
      formData.append('age', petAge);
      formData.append('breed', petBreed);
      formData.append('location', petLocation);
      formData.append('photo', petPhoto);
  
      // Upload the pet information and photo
      $.ajax({
        type: 'POST',
        url: '../images/' + petPhoto.name,
        data: formData, // Use formData here
        processData: false,
        contentType: false,
        success: function() {
          console.log('Pet information and photo uploaded successfully');
          // Proceed to register the pet on the blockchain
          registerPetOnBlockchain();
        },
        error: function(error) {
          console.error('Error occurred while uploading pet information and photo:', error);
        }
      });
  
      function registerPetOnBlockchain() {
        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
          console.log(petName, petPhoto.name, petAge, petBreed, petLocation);
          return adoptionInstance.addPet(petName, 'images/' + petPhoto.name, petAge, petBreed, petLocation, { from: account });
        }).then(function() {
          console.log('Pet registered on the blockchain');
          // Update the UI to display the newly registered pet
          var petsRow = $('#petsRow');
          var petTemplate = $('#petTemplate').html();
          petTemplate = petTemplate.replace('{{name}}', petName);
          petTemplate = petTemplate.replace('{{picture}}', 'images/' + petPhoto.name);
          petTemplate = petTemplate.replace('{{breed}}', petBreed);
          petTemplate = petTemplate.replace('{{age}}', petAge);
          petTemplate = petTemplate.replace('{{location}}', petLocation);
          petsRow.append(petTemplate);
  
          // Clear the form inputs
          $('#petName').val('');
          $('#petAge').val('');
          $('#petBreed').val('');
          $('#petLocation').val('');
          $('#petPhoto').val('');
  
          // Close the dialog
          $('#registerPetDialog').modal('hide');
  
          // Show success message
          $('#registerSuccessDialog').modal('show');
        }).catch(function(error) {
          console.error('Error occurred while registering pet:', error);
        });
      }
    });
  },
  
    // Perform your registration logic here using the entered pet details and uploaded photo
  
    // Close the dialog

  
  initWeb3: async function() {

    // Modern dapp browsers...
if (window.ethereum) {
  App.web3Provider = window.ethereum;
  try {
    // Request account access
    await window.ethereum.enable();
  } catch (error) {
    // User denied account access...
    console.error("User denied account access")
  }
}
// Legacy dapp browsers...
else if (window.web3) {
  App.web3Provider = window.web3.currentProvider;
}
// If no injected web3 instance is detected, fall back to Ganache
else {
  App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
}
web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-vote', App.handleVote);
    $('#registerPetButton').on('click', function() {
      // Clear the input fields of the registration form
      $('#petName').val('');
      $('#petAge').val('');
      $('#petBreed').val('');
      $('#petLocation').val('');
      $('#petPhoto').val('');
      // Open the registration dialog
      $('#registerPetDialog').modal('show');
    });

    $('#registerPetSubmitButton').on('click', function() {
      // Call the registerPet function
      App.registerPet();
    });
    
    $('#donateEtherButton').on('click', function() {
      // Clear the input field of the donation form
      $('#donationAmount').val('');
      // Open the donation dialog
      $('#donateEtherDialog').modal('show');
    });

    $('#donateEtherSubmitButton').on('click', function() {
      // Call the donateEther function
      App.donateEther();
    });
    

  },


  
  markAdopted: function(adopters, account) {
    var adoptionInstance;
  
    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
  
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
  
        // Get the vote count for each pet and update the UI
        adoptionInstance.getVoteCount.call(i).then(function(voteCount) {
          $('.panel-pet').eq(i).find('.vote-count').text('Votes: ' + voteCount);
        }).catch(function(error) {
          console.error('Error occurred while getting vote count:', error);
        });
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },
  

  handleVote: function(event) {
    event.preventDefault();
  
    var petId = parseInt($(event.target).data('id'));
  
    App.contracts.Adoption.deployed().then(function(instance) {
      return instance.vote(petId);
    }).then(function() {
      // Get the updated vote count for the pet and update the UI
      return adoptionInstance.getVoteCount.call(petId);
    }).then(function(voteCount) {
      $(event.target).siblings('.vote-count').text('Votes: ' + voteCount);
    }).catch(function(error) {
      console.error('Error occurred while voting:', error);
    });

    // Get the current timestamp
    var voteTime = new Date().toLocaleString();
  
    // Update the UI to display the vote time
    $(event.target).siblings('.vote-time').text('Voted on: ' + voteTime);
  
    // You can perform additional logic here such as updating the voting count in a smart contract or storing the vote data
  
    // You may want to consider disabling the vote button after it is clicked
    $(event.target).prop('disabled', true);
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
    
        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};



$(function() {
  $(window).load(function() {
    App.init();
  });
});