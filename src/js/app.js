


 function registerPet() {
  var petName = $('#petName').val();
  var petAge = $('#petAge').val();
  var petBreed = $('#petBreed').val();
  var petLocation = $('#petLocation').val();
  var petPhotoInput = $('#petPhoto')[0]; // Get the file input element
  var petPhoto = petPhotoInput.files[0]; // Get the selected file

  // Create a new FormData object
  var formData = new FormData();
  formData.append('name', petName);
  formData.append('age', petAge);
  formData.append('breed', petBreed);
  formData.append('location', petLocation);
  formData.append('photo', petPhoto);

  // Perform your registration logic here using the entered pet details and uploaded photo

  // Close the dialog
  $('#registerPetDialog').modal('hide');
}

function donateEther () {
  var donationAmount = $('#donationAmount').val();

  // Convert the donation amount to Wei
  var donationAmountWei = web3.toWei(donationAmount, 'ether');

  // Call the donate function in your smart contract, passing the donation amount in Wei
  App.contracts.Adoption.deployed().then(function(instance) {
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


App = {
  web3Provider: null,
  contracts: {},

 

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
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

    return await App.initWeb3();
  },

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
      }
    }).catch(function(err) {
      console.log(err.message);
    });
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