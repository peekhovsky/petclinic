package victor.training.petclinic.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import jakarta.transaction.Transactional;
import victor.training.petclinic.domain.Owner;
import victor.training.petclinic.domain.Pet;
import victor.training.petclinic.domain.PetType;
import victor.training.petclinic.repository.OwnerRepository;
import victor.training.petclinic.repository.PetRepository;
import victor.training.petclinic.repository.PetTypeRepository;

@SpringBootTest
@AutoConfigureEmbeddedDatabase(provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY)
@AutoConfigureMockMvc
@WithMockUser(roles = "OWNER_ADMIN")
@Transactional
class OwnerPagingTest {
    /** Unique in the seed data, so a search for it returns exactly the owners created here. */
    private static final String MARK = "zxqmark";

    @Autowired
    MockMvc mockMvc;
    @Autowired
    OwnerRepository ownerRepository;
    @Autowired
    PetRepository petRepository;
    @Autowired
    PetTypeRepository petTypeRepository;

    PetType dog;

    @BeforeEach
    void before() {
        dog = petTypeRepository.save(TestData.aPetType("zxqdog"));
    }

    private Owner anOwner(String firstName, String lastName, String address, String city, String telephone,
            String... petNames) {
        Owner owner = TestData.anOwner();
        owner.setFirstName(firstName);
        owner.setLastName(lastName);
        owner.setAddress(address);
        owner.setCity(city);
        owner.setTelephone(telephone);
        owner = ownerRepository.save(owner);
        for (String petName : petNames) {
            Pet pet = TestData.aPet();
            pet.setName(petName);
            pet.setBirthDate(LocalDate.of(2020, 1, 1));
            pet.setType(dog);
            pet.setOwner(owner);
            owner.addPet(petRepository.save(pet));
        }
        return owner;
    }

    private ResultActions list(String query) throws Exception {
        return mockMvc.perform(get("/api/owners" + query));
    }

    /** Three owners found by {@link #MARK}, whose columns sort in a different order each. */
    private void threeOwnersToSort() {
        anOwner("Ann", "Cole", "3 Alpha St", "Brno " + MARK, "0000000002", "Rex");
        anOwner("Bob", "Abel", "1 Gamma St", "Cork " + MARK, "0000000003", "Tom", "Max");
        anOwner("Cid", "Bale", "2 Beta St", "Aix " + MARK, "0000000001");
    }

    @Test
    void withoutParams_returnsFirstPageOfTenOrderedByName() throws Exception {
        list("").andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @ParameterizedTest
    @CsvSource({
            "first name,   ALPHAXQ",
            "last name,    betaxq",
            "address,      GammaXQ",
            "city,         deltaxq",
            "telephone,    9876543210",
            "pet name,     EPSILONXQ",
    })
    void search_matchesEachColumnIgnoringCase(String column, String term) throws Exception {
        anOwner("Alphaxq", "Betaxq", "Gammaxq St", "Deltaxq", "9876543210", "Epsilonxq");

        list("?search=" + term).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].lastName").value("Betaxq"));
    }

    @Test
    void search_ownerWithSeveralMatchingPets_appearsOnce() throws Exception {
        anOwner("Dup", "Licate", "addr", "city", "0000000000", "zxqpet1", "zxqpet2");

        list("?search=zxqpet").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void search_treatsPercentAsLiteral() throws Exception {
        anOwner("Per", "Cent", "addr", "city", "0000000000");

        list("?search=%25").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void search_noMatch_isEmptyPage() throws Exception {
        list("?search=nobody-" + MARK).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void paging_returnsTheRequestedSliceAndTheTotal() throws Exception {
        threeOwnersToSort();

        list("?search=" + MARK + "&size=2&page=0").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));
        list("?search=" + MARK + "&size=2&page=1").andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @CsvSource({
            "name,asc,        Abel;Bale;Cole",
            "name,desc,       Cole;Bale;Abel",
            "address,asc,     Abel;Bale;Cole",
            "address,desc,    Cole;Bale;Abel",
            "city,asc,        Bale;Cole;Abel",
            "city,desc,       Abel;Cole;Bale",
            "telephone,asc,   Bale;Cole;Abel",
            "telephone,desc,  Abel;Cole;Bale",
            "pets,asc,        Bale;Cole;Abel",
            "pets,desc,       Abel;Cole;Bale",
    })
    void sort_byEachColumnInBothDirections(String key, String direction, String expectedLastNames) throws Exception {
        threeOwnersToSort();
        String[] expected = expectedLastNames.split(";");

        ResultActions result = list("?search=" + MARK + "&sort=" + key + "," + direction)
                .andExpect(status().isOk());
        for (int i = 0; i < expected.length; i++) {
            result.andExpect(jsonPath("$.content[" + i + "].lastName").value(expected[i].trim()));
        }
    }

    @Test
    void sort_name_breaksLastNameTiesByFirstName() throws Exception {
        anOwner("Zed", "Same", "addr", MARK, "0000000000");
        anOwner("Amy", "Same", "addr", MARK, "0000000000");

        list("?search=" + MARK + "&sort=name,asc").andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Amy"))
                .andExpect(jsonPath("$.content[1].firstName").value("Zed"));
    }

    @Test
    void sort_withoutDirection_isAscending() throws Exception {
        threeOwnersToSort();

        list("?search=" + MARK + "&sort=address").andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].lastName").value("Abel"));
    }

    @Test
    void sort_equalValues_fallBackToIdSoPagesAreStable() throws Exception {
        int first = anOwner("Same", "Same", "addr", MARK, "0000000000").getId();
        int second = anOwner("Same", "Same", "addr", MARK, "0000000000").getId();

        list("?search=" + MARK + "&sort=city,asc").andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(first))
                .andExpect(jsonPath("$.content[1].id").value(second));
    }

    @ParameterizedTest
    @ValueSource(strings = {"sort=ssn,asc", "sort=name,sideways", "sort=name,asc,extra", "size=0",
            "size=101", "page=-1"})
    void invalidParameters_areBadRequest(String query) throws Exception {
        list("?" + query).andExpect(status().isBadRequest());
    }
}
