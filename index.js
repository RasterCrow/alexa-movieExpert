/**
 * TO_DO : 
 * 
 *      - get description of a movie chosen by the user
 *      - easter egg con i miei film preferiti.
 *  
 */

'use strict';
const Alexa = require('ask-sdk-core');
var stringSimilarity = require('string-similarity');
const MovieDb = require('moviedb-promise');


//ID of my skill
//moviedb api
const api_key = '';
const moviedb = new MovieDb(api_key);
const lan = 'it';
//Leastest page in can check to get a movie from
const maxPage = 10;

var movie = [{
    name: null,
    desc: null,
    genre: null,
    date: null,
    imageLink: null,
}];

var actorName = null;
var genreInput = null;

const SKILL_NAME = 'L\'esperto di film';
const WELCOME_MESSAGE = "Ciao, io sono L\'esperto di film. Prova a chiedermi un consiglio su che film guardare. Se hai bisogno di aiuto prova a chiedermi come funziono.";
const HELP_MESSAGE = 'é molto semplice, se hai voglia di vedere un film ma non sai scegliere basta chiedere a me. Prova a dire per esempio Consigliami un film a caso , oppure se vuoi un genere in particolare prova a dire Consigliami un film horror da guardare, oppure ancora Consigliami un film di tom hanks, se hai in mente un attore o regista particolare.';
const REPROMPT_MESSAGE = 'Non ho capito, puoi ripetere?';
const STOP_MESSAGE = 'Alla prossima!';
const speechMovieOut = [
    'Magari potrebbe interessarti ',
    'Mhhh, ho trovato ',
    'Questo non è male! ',
    'Questo ti piacerà, ',
    '',
    'è tra i miei preferiti : ',
    'Potrebbe piacerti ',
    'Ti interesserà sicuramente ',
    'Non l\'ho ancora visto, ma dicono sia bello, ',
    'Questo me lo ricordo ',
];

/**
 * Gets on of the top 3 best movie for the person in input
 * I tried getting the ID and using it to get all the movies this person did, but the list included bts stuff and random movies which he also produced.
 * With this method it only gets 3 of his top movies and returns a random one
 * 
 */
async function getPersonMovie(person) {
    var genres = [];
    try {
        genres = await get_movie_genres();
    } catch (error) {
        console.log("Non sono riuscito a recuperare i generi");
    }
    var ris = -1;
    const randomMovie = Math.floor(Math.random() * Math.floor(3));
    return new Promise(function (resolve) {
        moviedb.searchPerson({ language: lan, query: person }).then(res => {
            if ((res.results[0] != null || res.results[0] != '' || res.results[0] != undefined) && (res.results[0].known_for!=null || res.results[0].known_for!= '')) {
                console.log("actor found " + res.results[0].name);
                actorName = res.results[0].name;
                if (res.results[0].known_for[randomMovie].poster_path != '') {
                    if(res.results[0].adult ==false){
                        movie.imageLink = res.results[0].known_for[randomMovie].poster_path;
                    }
                }
                movie.name = res.results[0].known_for[randomMovie].title;
                if (res.results[0].known_for[randomMovie].overview != '') {
                    movie.desc = res.results[0].known_for[randomMovie].overview;
                } else {
                    movie.desc = 'Mi spiace, non la conosco!';
                }
                movie.date = res.results[0].known_for[randomMovie].release_date.slice(0, 4);
                genres.forEach(genreElem => {
                    if (res.results[0].known_for[randomMovie].genre_ids[0] == genreElem.id) {
                        movie.genre = genreElem.name;
                    }
                });
                ris = 0;
                return resolve(ris);
            }
            return resolve(ris);
        }).catch(console.error);
    });
}

//REturns a list of movies with name and description based on the genre in input. There are 20 movies per page.
async function getMovie(genre) {
    var trovato = false;
    const randomPage = Math.floor(Math.random() * (maxPage - 1)) + 1;
    return new Promise(function (resolve) {
        var x = 0;
        moviedb.genreMovies({ id: genre, page: randomPage, language: lan, include_adult: false }).then(res => {
            var randomInt = Math.floor(Math.random() * (res.results.length - 2)) + 2;
            res.results.forEach(element => {
                if (x == randomInt && trovato == false) {
                    if (/^[a-zA-Z]/.test(element.title)) {
                        movie.imageLink = element.poster_path;
                        movie.name = element.title;
                        if (element.overview == '' || element.overview == null) {
                            movie.desc = "Mi spiace, non la conosco!";
                        } else {
                            movie.desc = element.overview;
                        }
                        movie.date = (element.release_date).substring(0, 4);
                        trovato = true;

                    } else {
                        randomInt++;
                    }
                } else {
                    x++;
                }
            });
            return resolve(1);


        }).catch(console.error);

    });
}

//Returns all the movies genres possibilities
async function get_movie_genres() {
    return new Promise(function (resolve) {
        moviedb.genreMovieList({language: lan}).then(res => {
            return resolve(res.genres);
        }).catch(console.error);

    });
}

//Get the id of the genre given in input.
//Checks iwth similarity algorithm which is the most appropriate one in tmdb.
async function getGenreID(input) {
    var genres = [];
    var similarity;
    var bestSimilarity = 0;
    var id = 0;
    try {
        genres = await get_movie_genres();
    } catch (error) {
        console.log("Non sono riuscito a recuperare i generi");
    }
    return new Promise(function (resolve) {
        genres.forEach(element => {
            similarity = stringSimilarity.compareTwoStrings(input, element.name);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                id = element.id;
            }
        });
        return resolve(id);
    });
}


//Gets a random movie within the first 20 pages.
async function randomMovie() {
    var genres = [];
    try {
        genres = await get_movie_genres();
    } catch (error) {
        console.log("Non sono riuscito a recuperare i generi");
    }
    return new Promise(function (resolve) {

        var x = 0;
        const randomPage = Math.floor(Math.random() * (maxPage - 1)) + 1;
        moviedb.miscPopularMovies({ language: lan, page: randomPage }).then(res => {
            var randomInt = Math.floor(Math.random() * (res.results.length - 1)) + 1;
            res.results.forEach(element => {
                if (x == randomInt) {
                    if (/^[a-zA-Z]/.test(element.title)) {
                        if(element.adult==false){
                            movie.imageLink = element.poster_path;
                        }
                        movie.name = element.title;
                        if (element.overview == '' || element.overview == null) {
                            movie.desc = "Mi spiace, non la conosco!";
                        } else {
                            movie.desc = element.overview;
                        }
                        movie.date = (element.release_date).substring(0, 4);
                        genres.forEach(genreElem => {
                            if (element.genre_ids.indexOf(genreElem.id) > -1) {
                                movie.genre = genreElem.name;
                            }
                        });
                        if (movie.genre == null) {
                            movie.genre == "Mi spiace, non lo conosco";
                        }

                    }
                }
                x++;
            });
            return resolve(1);
        });

    });

}

/* INTENT HANDLERS */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(WELCOME_MESSAGE)
            .reprompt(REPROMPT_MESSAGE)
            .getResponse();
    },
};

const RandomMovieIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RandomMovieIntent'
            || (handlerInput.requestEnvelope.request.intent.name === 'AnotherOneIntent'
                && (genreInput == null)
                && (actorName == null));
    },
    async handle(handlerInput) {
        var ris = 0;
        //retrieve a random movie
        console.log('pre random movie');
        try {
            ris = await randomMovie();
        } catch (error) {
            console.log("Non sono riuscito a recuperare un film casuale");
        }
        //Get random speechoutput
        const speechIndex = Math.floor(Math.random() * speechMovieOut.length);
        const speechOutput = speechMovieOut[speechIndex] + movie.name + ', film del ' + movie.date + ' di genere ' + movie.genre + '. Vuoi un film diverso o vuoi sentirne la trama?';
        //if there's a poster it send a standardCard, otherwise a simpleCard
        if (movie.imageLink != null) {
            var smallImageUrl = "https://image.tmdb.org/t/p/w780/" + movie.imageLink;
            var largeImageUrl = "https://image.tmdb.org/t/p/w1200" + movie.imageLink;

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(REPROMPT_MESSAGE)
                .withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                //.withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(REPROMPT_MESSAGE)
                //.withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                .withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        }
    },
};

const GetMovieByPersonIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetMovieByPersonIntent'
            || (handlerInput.requestEnvelope.request.intent.name === 'AnotherOneIntent'
                && (actorName !== null)
                && (genreInput == null));
    },
    async handle(handlerInput) {
        var ris = 0;
        genreInput = null;
        if (!actorName) {
            actorName = handlerInput.requestEnvelope.request.intent.slots.personName.value;
        }
        if (handlerInput.requestEnvelope.request.intent.slots != null) {
            actorName = handlerInput.requestEnvelope.request.intent.slots.personName.value;
        }
        //retrieve a random movie
        try {
            ris = await getPersonMovie(actorName);
        } catch (error) {
            console.log("Non sono riuscito a recuperare le persone" + error);
        }
        if (ris == -1) {
            const speechOutput = "Non sono riuscito a trovare la persona che cercavi!";
            return handlerInput.responseBuilder
                .speak(speechOutput)
                //.withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                .withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        } else {
            //Get random speechoutput
            const speechIndex = Math.floor(Math.random() * speechMovieOut.length);
            const speechOutput = speechMovieOut[speechIndex] + movie.name + ', è un film di ' + actorName + ' di genere ' + movie.genre + ' del ' + movie.date + ' . Vuoi un film diverso o vuoi sentirne la trama?';
            //if there's a poster it send a standardCard, otherwise a simpleCard
            if (movie.imageLink != null) {
                var smallImageUrl = "https://image.tmdb.org/t/p/w780/" + movie.imageLink;
                var largeImageUrl = "https://image.tmdb.org/t/p/w1200" + movie.imageLink;

                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .reprompt(REPROMPT_MESSAGE)
                    .withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                    .getResponse();
            } else {
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .reprompt(REPROMPT_MESSAGE)
                    .withSimpleCard(SKILL_NAME, speechOutput)
                    .getResponse();
            }
        }
    },
};

const MovieByGenreIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'MovieByGenreIntent'
            || (handlerInput.requestEnvelope.request.intent.name === 'AnotherOneIntent'
                && (genreInput !== null)
                && (actorName == null));
    },
    async handle(handlerInput) {
        var ris = 0;
        var genreID = 0;
        actorName = null;
        if (!genreInput) {
            genreInput = handlerInput.requestEnvelope.request.intent.slots.genre.value;
        }
        if (handlerInput.requestEnvelope.request.intent.slots != null) {
            genreInput = handlerInput.requestEnvelope.request.intent.slots.genre.value;
        }
        //retrieve genre id, based on the input of the user
        try {
            genreID = await getGenreID(genreInput);
        } catch (error) {
            console.log("Non sono riuscito a recuperare i generi " + error);
        }
        //if the id is found retrieves a list of movies based on that genre.
        if (genreID == 0) {
            const speechOutput = "Mi dispiace, ma non ho capito il genere.";
            console.log("Non ho capito il genere." + error);
            return handlerInput.responseBuilder
                .speak(speechOutput)
                //.withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                .withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        } else {
            try {
                ris = await getMovie(genreID);
            } catch (error) {
                console.log("Non sono riuscito a recuperare i film : " + error);
            }
        }
        console.log(ris + " post richiesta film con film trovato : " + movie.name);
        //Get random speechoutput
        const speechIndex = Math.floor(Math.random() * speechMovieOut.length);
        const speechOutput = speechMovieOut[speechIndex] + movie.name + ', film del ' + movie.date + ' . Vuoi un film diverso o vuoi sentirne la trama?';

        //if there's a poster it send a standardCard, otherwise a simpleCard
        if (movie.imageLink != null) {
            var smallImageUrl = "https://image.tmdb.org/t/p/w780/" + movie.imageLink;
            var largeImageUrl = "https://image.tmdb.org/t/p/w1200" + movie.imageLink;

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(REPROMPT_MESSAGE)
                .withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                //.withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(REPROMPT_MESSAGE)
                //.withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                .withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        }

    },
};

const DescAnswerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "IntentRequest"
            && request.intent.name === 'DescRequestIntent';
    },
    handle(handlerInput) {
        const speechOutput = movie.desc;
        if (movie.imageLink != null) {
            var smallImageUrl = "https://image.tmdb.org/t/p/w780/" + movie.imageLink;
            var largeImageUrl = "https://image.tmdb.org/t/p/w1200" + movie.imageLink;

            return handlerInput.responseBuilder
                .speak(speechOutput)
                
                .withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                //.withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(speechOutput)
                
                //.withStandardCard(SKILL_NAME, speechOutput, smallImageUrl, largeImageUrl)
                .withSimpleCard(SKILL_NAME, speechOutput)
                .getResponse();
        }
    }

};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(REPROMPT_MESSAGE)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(STOP_MESSAGE)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(REPROMPT_MESSAGE)
            .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RandomMovieIntentHandler,
        MovieByGenreIntentHandler,
        GetMovieByPersonIntentHandler,
        DescAnswerHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();